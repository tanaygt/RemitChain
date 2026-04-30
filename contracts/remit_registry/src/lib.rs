#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, token,
    Address, Env, String, Symbol, Vec,
};

#[contract]
pub struct RemitRegistryContract;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AdminNotInitialized = 1,
    AmountNotPositive = 2,
    AlreadyInitialized = 3,
    NotPending = 4,
    NotSender = 5,
    RemittanceNotFound = 6,
}

#[derive(Clone)]
#[contracttype]
pub enum RemittanceStatus {
    Pending,
    Completed,
    Refunded,
}

#[derive(Clone)]
#[contracttype]
pub struct Remittance {
    pub id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub token: Address,
    pub amount: i128,
    pub country: Symbol,
    pub memo: String,
    pub status: RemittanceStatus,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct RemittanceStats {
    pub total_count: u64,
    pub pending_count: u64,
    pub completed_count: u64,
    pub refunded_count: u64,
    pub escrowed_amount: i128,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    NextId,
    Remittance(u64),
    SenderIds(Address),
    FeeVault,
}

mod vault {
    soroban_sdk::contractimport!(file = "../../target/wasm32-unknown-unknown/release/fee_vault.wasm");
}

fn read_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .unwrap_or_else(|| panic_with_error!(env, Error::AdminNotInitialized))
}

fn next_id(env: &Env) -> u64 {
    let id = env.storage().instance().get(&DataKey::NextId).unwrap_or(1_u64);
    env.storage().instance().set(&DataKey::NextId, &(id + 1));
    id
}

fn read_remittance(env: &Env, id: u64) -> Remittance {
    env.storage()
        .persistent()
        .get(&DataKey::Remittance(id))
        .unwrap_or_else(|| panic_with_error!(env, Error::RemittanceNotFound))
}

fn write_remittance(env: &Env, remittance: &Remittance) {
    env.storage()
        .persistent()
        .set(&DataKey::Remittance(remittance.id), remittance);
}

fn append_sender_id(env: &Env, sender: &Address, id: u64) {
    let key = DataKey::SenderIds(sender.clone());
    let mut ids: Vec<u64> = env.storage().persistent().get(&key).unwrap_or(Vec::new(env));
    ids.push_back(id);
    env.storage().persistent().set(&key, &ids);
}

fn bump_ttl(env: &Env, id: u64, sender: &Address) {
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::Remittance(id), 1_000, 10_000);
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::SenderIds(sender.clone()), 1_000, 10_000);
}

#[contractimpl]
impl RemitRegistryContract {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextId, &1_u64);
    }

    pub fn set_vault(env: Env, vault: Address) {
        let admin = read_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::FeeVault, &vault);
        env.events().publish((symbol_short!("vault"), symbol_short!("set")), vault);
    }

    pub fn create_remittance(
        env: Env,
        sender: Address,
        recipient: Address,
        token_address: Address,
        amount: i128,
        country: Symbol,
        memo: String,
    ) -> u64 {
        if amount <= 0 {
            panic_with_error!(&env, Error::AmountNotPositive);
        }

        sender.require_auth();

        let contract_address = env.current_contract_address();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&sender, &contract_address, &amount);

        let id = next_id(&env);
        let now = env.ledger().timestamp();
        let remittance = Remittance {
            id,
            sender: sender.clone(),
            recipient,
            token: token_address,
            amount,
            country,
            memo,
            status: RemittanceStatus::Pending,
            created_at: now,
            updated_at: now,
        };

        write_remittance(&env, &remittance);
        append_sender_id(&env, &sender, id);
        bump_ttl(&env, id, &sender);

        env.events()
            .publish((symbol_short!("created"), id), remittance.clone());

        if env.storage().instance().has(&DataKey::FeeVault) {
            let vault_id: Address = env.storage().instance().get(&DataKey::FeeVault).unwrap();
            let vault_client = vault::Client::new(&env, &vault_id);
            vault_client.deposit_fees(&1u128); // Charge 1 unit fee
        }

        id
    }

    pub fn complete_remittance(env: Env, id: u64) -> Remittance {
        let admin = read_admin(&env);
        admin.require_auth();

        let mut remittance = read_remittance(&env, id);
        if !matches!(remittance.status, RemittanceStatus::Pending) {
            panic_with_error!(&env, Error::NotPending);
        }

        let contract_address = env.current_contract_address();
        let token_client = token::Client::new(&env, &remittance.token);
        token_client.transfer(&contract_address, &remittance.recipient, &remittance.amount);

        remittance.status = RemittanceStatus::Completed;
        remittance.updated_at = env.ledger().timestamp();
        write_remittance(&env, &remittance);
        bump_ttl(&env, id, &remittance.sender);

        env.events()
            .publish((symbol_short!("complete"), id), remittance.clone());

        remittance
    }

    pub fn refund_remittance(env: Env, sender: Address, id: u64) -> Remittance {
        sender.require_auth();

        let mut remittance = read_remittance(&env, id);
        if remittance.sender != sender {
            panic_with_error!(&env, Error::NotSender);
        }
        if !matches!(remittance.status, RemittanceStatus::Pending) {
            panic_with_error!(&env, Error::NotPending);
        }

        let contract_address = env.current_contract_address();
        let token_client = token::Client::new(&env, &remittance.token);
        token_client.transfer(&contract_address, &remittance.sender, &remittance.amount);

        remittance.status = RemittanceStatus::Refunded;
        remittance.updated_at = env.ledger().timestamp();
        write_remittance(&env, &remittance);
        bump_ttl(&env, id, &remittance.sender);

        env.events()
            .publish((symbol_short!("refund"), id), remittance.clone());

        remittance
    }

    pub fn get_remittance(env: Env, id: u64) -> Remittance {
        read_remittance(&env, id)
    }

    pub fn get_sender_remittances(env: Env, sender: Address) -> Vec<Remittance> {
        let key = DataKey::SenderIds(sender.clone());
        let ids: Vec<u64> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        let mut items = Vec::new(&env);

        for id in ids.iter() {
            items.push_back(read_remittance(&env, id));
        }

        items
    }

    pub fn get_recent(env: Env, limit: u32) -> Vec<Remittance> {
        let next = env.storage().instance().get(&DataKey::NextId).unwrap_or(1_u64);
        let mut current = if next > 1 { next - 1 } else { 0 };
        let mut count = 0_u32;
        let mut items = Vec::new(&env);

        while current > 0 && count < limit {
            if env
                .storage()
                .persistent()
                .has(&DataKey::Remittance(current))
            {
                items.push_back(read_remittance(&env, current));
                count += 1;
            }
            current -= 1;
        }

        items
    }

    pub fn get_stats(env: Env, limit: u32) -> RemittanceStats {
        let recent = Self::get_recent(env, limit);
        let mut pending_count = 0_u64;
        let mut completed_count = 0_u64;
        let mut refunded_count = 0_u64;
        let mut escrowed_amount = 0_i128;

        for item in recent.iter() {
            match item.status {
                RemittanceStatus::Pending => {
                    pending_count += 1;
                    escrowed_amount += item.amount;
                }
                RemittanceStatus::Completed => {
                    completed_count += 1;
                }
                RemittanceStatus::Refunded => {
                    refunded_count += 1;
                }
            }
        }

        RemittanceStats {
            total_count: recent.len().into(),
            pending_count,
            completed_count,
            refunded_count,
            escrowed_amount,
        }
    }
}
