module trustiq::trust_registry {
    use std::string;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    /// Main registry storing user trust profiles
    struct TrustRegistry has key {
        id: UID,
        users: vector<TrustProfile>,
        verifiers: vector<address>,
        admin: address,
    }

    /// Individual user trust profile
    struct TrustProfile has key, store {
        id: UID,
        owner: address,
        did: string::String,
        trust_score: u64,
        verified_accounts: vector<VerifiedAccount>,
        metadata_cid: string::String,
        created_at: u64,
        updated_at: u64,
    }

    /// Verified external account (GitHub, LinkedIn, etc.)
    struct VerifiedAccount has store {
        provider: string::String,
        username: string::String,
        verified_at: u64,
        proof_hash: vector<u8>,
    }

    /// Events
    struct TrustProfileCreated has copy, drop {
        user: address,
        did: string::String,
        trust_score: u64,
    }

    struct TrustScoreUpdated has copy, drop {
        user: address,
        old_score: u64,
        new_score: u64,
        metadata_cid: string::String,
    }

    /// Error codes
    const ENotAdmin: u64 = 1;
    const EUserAlreadyExists: u64 = 2;
    const EUserNotFound: u64 = 3;

    public fun init(ctx: &mut TxContext) {
        let registry = TrustRegistry {
            id: object::new(ctx),
            users: vector::empty(),
            verifiers: vector::empty(),
            admin: tx_context::sender(ctx),
        };
        
        transfer::share_object(registry);
    }

    /// Create a new trust profile for a user
    public entry fun create_trust_profile(
        registry: &mut TrustRegistry,
        user: address,
        did: string::String,
        metadata_cid: string::String,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, ENotAdmin);
        
        // Check if user already exists
        let index = 0;
        let user_exists = false;
        while (index < vector::length(&registry.users)) {
            let profile = vector::borrow(&registry.users, index);
            if (profile.owner == user) {
                user_exists = true;
                break;
            };
            index = index + 1;
        };
        
        assert!(!user_exists, EUserAlreadyExists);

        let profile = TrustProfile {
            id: object::new(ctx),
            owner: user,
            did,
            trust_score: 50, // Default starting score
            verified_accounts: vector::empty(),
            metadata_cid,
            created_at: tx_context::epoch(ctx),
            updated_at: tx_context::epoch(ctx),
        };

        vector::push_back(&mut registry.users, profile);

        event::emit(TrustProfileCreated {
            user,
            did: copy did,
            trust_score: 50,
        });
    }

    /// Update user's trust score (only callable by oracle/verifier)
    public entry fun update_trust_score(
        registry: &mut TrustRegistry,
        user: address,
        new_score: u64,
        metadata_cid: string::String,
        ctx: &mut TxContext
    ) {
        assert!(is_verifier(registry, tx_context::sender(ctx)), ENotAdmin);

        let index = 0;
        while (index < vector::length(&registry.users)) {
            let profile = vector::borrow_mut(&mut registry.users, index);
            if (profile.owner == user) {
                let old_score = profile.trust_score;
                profile.trust_score = new_score;
                profile.metadata_cid = metadata_cid;
                profile.updated_at = tx_context::epoch(ctx);

                event::emit(TrustScoreUpdated {
                    user,
                    old_score,
                    new_score,
                    metadata_cid: copy metadata_cid,
                });
                return;
            };
            index = index + 1;
        };

        abort EUserNotFound
    }

    /// Add verified account to user profile
    public entry fun add_verified_account(
        registry: &mut TrustRegistry,
        user: address,
        provider: string::String,
        username: string::String,
        proof_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let index = 0;
        while (index < vector::length(&registry.users)) {
            let profile = vector::borrow_mut(&mut registry.users, index);
            if (profile.owner == user) {
                let verified_account = VerifiedAccount {
                    provider,
                    username,
                    verified_at: tx_context::epoch(ctx),
                    proof_hash,
                };
                vector::push_back(&mut profile.verified_accounts, verified_account);
                profile.updated_at = tx_context::epoch(ctx);
                return;
            };
            index = index + 1;
        };

        abort EUserNotFound
    }

    /// Register a new verifier
    public entry fun register_verifier(
        registry: &mut TrustRegistry,
        verifier: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, ENotAdmin);
        vector::push_back(&mut registry.verifiers, verifier);
    }

    /// Check if address is a verifier
    public fun is_verifier(registry: &TrustRegistry, addr: address): bool {
        let index = 0;
        while (index < vector::length(&registry.verifiers)) {
            if (vector::borrow(&registry.verifiers, index) == &addr) {
                return true;
            };
            index = index + 1;
        };
        false
    }

    #[view]
    public fun get_trust_profile(registry: &TrustRegistry, user: address): &TrustProfile {
        let index = 0;
        while (index < vector::length(&registry.users)) {
            let profile = vector::borrow(&registry.users, index);
            if (profile.owner == user) {
                return profile;
            };
            index = index + 1;
        };
        abort EUserNotFound
    }
}