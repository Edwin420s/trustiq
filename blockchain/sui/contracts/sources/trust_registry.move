module trustiq::trust_registry {
    use std::string;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::vec_map;
    use sui::type_name;

    struct TrustRegistry has key {
        id: UID,
        users: vec_map::VecMap<address, TrustProfile>,
        verifiers: vector<address>,
        admin: address,
        user_count: u64,
    }

    struct TrustProfile has key, store {
        id: UID,
        owner: address,
        did: string::String,
        trust_score: u64,
        verified_accounts: vector<VerifiedAccount>,
        metadata_cid: string::String,
        created_at: u64,
        updated_at: u64,
        version: u64,
    }

    struct VerifiedAccount has store {
        provider: string::String,
        username: string::String,
        verified_at: u64,
        proof_hash: vector<u8>,
        account_id: string::String,
    }

    struct TrustProfileCreated has copy, drop {
        user: address,
        did: string::String,
        trust_score: u64,
        timestamp: u64,
    }

    struct TrustScoreUpdated has copy, drop {
        user: address,
        old_score: u64,
        new_score: u64,
        metadata_cid: string::String,
        timestamp: u64,
    }

    struct AccountVerified has copy, drop {
        user: address,
        provider: string::String,
        username: string::String,
        timestamp: u64,
    }

    struct VerifierRegistered has copy, drop {
        verifier: address,
        timestamp: u64,
    }

    const ENotAdmin: u64 = 0;
    const EUserAlreadyExists: u64 = 1;
    const EUserNotFound: u64 = 2;
    const ENotVerifier: u64 = 3;
    const EInvalidScore: u64 = 4;

    public fun init(ctx: &mut TxContext) {
        let registry = TrustRegistry {
            id: object::new(ctx),
            users: vec_map::empty(),
            verifiers: vector::empty(),
            admin: tx_context::sender(ctx),
            user_count: 0,
        };
        
        transfer::share_object(registry);
    }

    public entry fun create_trust_profile(
        registry: &mut TrustRegistry,
        user: address,
        did: string::String,
        metadata_cid: string::String,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, ENotAdmin);
        assert!(!vec_map::contains(&registry.users, &user), EUserAlreadyExists);

        let profile = TrustProfile {
            id: object::new(ctx),
            owner: user,
            did,
            trust_score: 50,
            verified_accounts: vector::empty(),
            metadata_cid,
            created_at: tx_context::epoch(ctx),
            updated_at: tx_context::epoch(ctx),
            version: 1,
        };

        vec_map::insert(&mut registry.users, user, profile);
        registry.user_count = registry.user_count + 1;

        event::emit(TrustProfileCreated {
            user,
            did: copy did,
            trust_score: 50,
            timestamp: tx_context::epoch(ctx),
        });
    }

    public entry fun update_trust_score(
        registry: &mut TrustRegistry,
        user: address,
        new_score: u64,
        metadata_cid: string::String,
        ctx: &mut TxContext
    ) {
        assert!(is_verifier(registry, tx_context::sender(ctx)), ENotVerifier);
        assert!(new_score <= 100, EInvalidScore);

        assert!(vec_map::contains(&registry.users, &user), EUserNotFound);
        let profile = vec_map::get_mut(&mut registry.users, &user);

        let old_score = profile.trust_score;
        profile.trust_score = new_score;
        profile.metadata_cid = metadata_cid;
        profile.updated_at = tx_context::epoch(ctx);
        profile.version = profile.version + 1;

        event::emit(TrustScoreUpdated {
            user,
            old_score,
            new_score,
            metadata_cid: copy metadata_cid,
            timestamp: tx_context::epoch(ctx),
        });
    }

    public entry fun add_verified_account(
        registry: &mut TrustRegistry,
        user: address,
        provider: string::String,
        username: string::String,
        proof_hash: vector<u8>,
        account_id: string::String,
        ctx: &mut TxContext
    ) {
        assert!(is_verifier(registry, tx_context::sender(ctx)), ENotVerifier);
        assert!(vec_map::contains(&registry.users, &user), EUserNotFound);

        let profile = vec_map::get_mut(&mut registry.users, &user);
        
        let verified_account = VerifiedAccount {
            provider,
            username,
            verified_at: tx_context::epoch(ctx),
            proof_hash,
            account_id,
        };
        
        vector::push_back(&mut profile.verified_accounts, verified_account);
        profile.updated_at = tx_context::epoch(ctx);
        profile.version = profile.version + 1;

        event::emit(AccountVerified {
            user,
            provider: copy provider,
            username: copy username,
            timestamp: tx_context::epoch(ctx),
        });
    }

    public entry fun register_verifier(
        registry: &mut TrustRegistry,
        verifier: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, ENotAdmin);
        vector::push_back(&mut registry.verifiers, verifier);

        event::emit(VerifierRegistered {
            verifier,
            timestamp: tx_context::epoch(ctx),
        });
    }

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

    public fun get_user_count(registry: &TrustRegistry): u64 {
        registry.user_count
    }

    #[view]
    public fun get_trust_profile(registry: &TrustRegistry, user: address): &TrustProfile {
        assert!(vec_map::contains(&registry.users, &user), EUserNotFound);
        vec_map::get(&registry.users, &user)
    }

    #[view]
    public fun get_trust_score(registry: &TrustRegistry, user: address): u64 {
        assert!(vec_map::contains(&registry.users, &user), EUserNotFound);
        let profile = vec_map::get(&registry.users, &user);
        profile.trust_score
    }

    #[view]
    public fun has_profile(registry: &TrustRegistry, user: address): bool {
        vec_map::contains(&registry.users, &user)
    }
}