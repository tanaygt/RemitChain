#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol};

#[contract]
pub struct FeeVault;

const TOTAL_FEES: Symbol = symbol_short!("TOT_FEE");
const ADMIN: Symbol = symbol_short!("ADMIN");

#[contractimpl]
impl FeeVault {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&TOTAL_FEES, &0u128);
    }

    pub fn deposit_fees(env: Env, amount: u128) {
        // In a real app, we might check if caller is the registry
        let current: u128 = env.storage().instance().get(&TOTAL_FEES).unwrap_or(0);
        env.storage()
            .instance()
            .set(&TOTAL_FEES, &(current + amount));

        env.events()
            .publish((symbol_short!("fee"), symbol_short!("dep")), amount);
    }

    pub fn get_total_fees(env: Env) -> u128 {
        env.storage().instance().get(&TOTAL_FEES).unwrap_or(0)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&ADMIN)
            .expect("not initialized")
    }
}
