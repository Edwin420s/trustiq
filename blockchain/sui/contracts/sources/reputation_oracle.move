module trustiq::reputation_oracle {
    use std::vector;
    use std::string;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::crypto;
    use sui::bag;

    /// Oracle that signs and verifies trust score updates
    struct ReputationOracle has key {
        id: UID,
        admin: address,
        verifiers: vector<address>,
        min_verifications: u64,
        score_updates: bag::Bag<ScoreUpdate>,
    }

    /// Signed score update from oracle
    struct ScoreUpdate has store {
        user: address,
        score: u64,
        timestamp: u64,
        signature: vector<u8>,
        verifier: address,
        metadata_cid: string::String,
    }

    /// Oracle configuration
    struct OracleConfig has key {
        id: UID,
        min_verifications: u64,
        update_cooldown: u64,
        max_score_change: u64,
    }

    /// Events
    struct ScoreUpdateSigned has copy, drop {
        user: address,
        score: u64,
        verifier: address,
        timestamp: u64,
    }

    struct OracleVerifierAdded has copy, drop {
        verifier: address,
        added_by: address,
    }

    struct OracleVerifierRemoved has copy, drop {
        verifier: address,
        removed_by: address,
    }

    /// Error codes
    const ENotAdmin: u64 = 0;
    const ENotVerifier: u64 = 1;
    const EInvalidSignature: u64 = 2;
    const EInsufficientVerifications: u64 = 3;
    const EScoreChangeTooLarge: u64 = 4;
    const EUpdateTooFrequent: u64 = 5;

    /// Initialize the reputation oracle
    public fun init(ctx: &mut TxContext) {
        let oracle = ReputationOracle {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            verifiers: vector::empty(),
            min_verifications: 1,
            score_updates: bag::new(),
        };

        let config = OracleConfig {
            id: object::new(ctx),
            min_verifications: 1,
            update_cooldown: 3600, // 1 hour
            max_score_change: 20,  // Max 20 points change
        };

        transfer::share_object(oracle);
        transfer::transfer(config, tx_context::sender(ctx));
    }

    /// Add a verifier to the oracle
    public entry fun add_verifier(
        oracle: &mut ReputationOracle,
        verifier: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == oracle.admin, ENotAdmin);
        
        // Check if verifier already exists
        let index = 0;
        while (index < vector::length(&oracle.verifiers)) {
            if (vector::borrow(&oracle.verifiers, index) == &verifier) {
                return;
            };
            index = index + 1;
        };

        vector::push_back(&mut oracle.verifiers, verifier);

        event::emit(OracleVerifierAdded {
            verifier,
            added_by: tx_context::sender(ctx),
        });
    }

    /// Remove a verifier from the oracle
    public entry fun remove_verifier(
        oracle: &mut ReputationOracle,
        verifier: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == oracle.admin, ENotAdmin);
        
        let index = 0;
        while (index < vector::length(&oracle.verifiers)) {
            if (vector::borrow(&oracle.verifiers, index) == &verifier) {
                vector::remove(&mut oracle.verifiers, index);
                event::emit(OracleVerifierRemoved {
                    verifier,
                    removed_by: tx_context::sender(ctx),
                });
                return;
            };
            index = index + 1;
        };
    }

    /// Submit a signed score update
    public entry fun submit_score_update(
        oracle: &mut ReputationOracle,
        user: address,
        score: u64,
        timestamp: u64,
        signature: vector<u8>,
        metadata_cid: string::String,
        ctx: &mut TxContext
    ) {
        let verifier = tx_context::sender(ctx);
        assert!(is_verifier(oracle, verifier), ENotVerifier);

        // Verify signature (simplified - in production use proper verification)
        assert!(verify_signature(user, score, timestamp, signature, verifier), EInvalidSignature);

        // Create score update record
        let update = ScoreUpdate {
            user,
            score,
            timestamp,
            signature,
            verifier,
            metadata_cid,
        };

        // Add to updates bag
        bag::add(&mut oracle.score_updates, update);

        event::emit(ScoreUpdateSigned {
            user,
            score,
            verifier,
            timestamp,
        });
    }

    /// Get consensus score for a user
    public fun get_consensus_score(oracle: &ReputationOracle, user: address): (u64, u64) {
        let updates = bag::values(&oracle.score_updates);
        let total_score = 0;
        let count = 0;
        let index = 0;

        while (index < vector::length(&updates)) {
            let update = vector::borrow(&updates, index);
            if (update.user == user) {
                total_score = total_score + update.score;
                count = count + 1;
            };
            index = index + 1;
        };

        if (count > 0) {
            (total_score / count, count)
        } else {
            (50, 0) // Default score
        }
    }

    /// Check if address is a verifier
    public fun is_verifier(oracle: &ReputationOracle, addr: address): bool {
        let index = 0;
        while (index < vector::length(&oracle.verifiers)) {
            if (vector::borrow(&oracle.verifiers, index) == &addr) {
                return true;
            };
            index = index + 1;
        };
        false
    }

    /// Verify signature (placeholder implementation)
    fun verify_signature(
        user: address,
        score: u64,
        timestamp: u64,
        signature: vector<u8>,
        verifier: address
    ): bool {
        // In production, this would verify the cryptographic signature
        // For now, return true for testing
        true
    }

    #[view]
    public fun get_verifier_count(oracle: &ReputationOracle): u64 {
        vector::length(&oracle.verifiers)
    }

    #[view]
    public fun get_min_verifications(oracle: &ReputationOracle): u64 {
        oracle.min_verifications
    }
}