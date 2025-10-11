module trustiq::trust_badge {
    use std::string;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::url;

    /// Soulbound Trust Badge NFT
    struct TrustBadge has key, store {
        id: UID,
        owner: address,
        badge_type: string::String,
        trust_score: u64,
        metadata_url: url::Url,
        issued_at: u64,
        expires_at: u64,
        version: u64,
    }

    /// Badge metadata stored off-chain
    struct BadgeMetadata has drop {
        name: string::String,
        description: string::String,
        image_url: url::Url,
        attributes: vector<BadgeAttribute>,
    }

    struct BadgeAttribute has drop {
        trait_type: string::String,
        value: string::String,
    }

    /// Events
    struct TrustBadgeMinted has copy, drop {
        owner: address,
        badge_type: string::String,
        trust_score: u64,
        metadata_url: url::Url,
    }

    struct TrustBadgeUpdated has copy, drop {
        owner: address,
        old_score: u64,
        new_score: u64,
        metadata_url: url::Url,
    }

    /// Error codes
    const ENotAuthorized: u64 = 0;
    const EBadgeNotFound: u64 = 1;
    const EBadgeNotExpired: u64 = 2;

    /// Create a new trust badge
    public fun mint_trust_badge(
        owner: address,
        badge_type: string::String,
        trust_score: u64,
        metadata_url: url::Url,
        ctx: &mut TxContext
    ): TrustBadge {
        let badge = TrustBadge {
            id: object::new(ctx),
            owner,
            badge_type,
            trust_score,
            metadata_url,
            issued_at: tx_context::epoch(ctx),
            expires_at: tx_context::epoch(ctx) + 31536000, // 1 year
            version: 1,
        };

        // Transfer to owner (soulbound - cannot be transferred again)
        transfer::transfer(badge, owner);

        event::emit(TrustBadgeMinted {
            owner,
            badge_type: copy badge_type,
            trust_score,
            metadata_url: copy metadata_url,
        });

        badge
    }

    /// Update trust badge score
    public fun update_trust_badge(
        badge: &mut TrustBadge,
        new_score: u64,
        new_metadata_url: url::Url,
        ctx: &mut TxContext
    ) {
        let old_score = badge.trust_score;
        badge.trust_score = new_score;
        badge.metadata_url = new_metadata_url;
        badge.version = badge.version + 1;
        badge.expires_at = tx_context::epoch(ctx) + 31536000; // Renew for 1 year

        event::emit(TrustBadgeUpdated {
            owner: badge.owner,
            old_score,
            new_score,
            metadata_url: copy new_metadata_url,
        });
    }

    /// Check if badge is expired
    public fun is_expired(badge: &TrustBadge, ctx: &TxContext): bool {
        badge.expires_at < tx_context::epoch(ctx)
    }

    /// Get badge tier based on score
    public fun get_badge_tier(score: u64): string::String {
        if (score >= 90) {
            string::utf8(b"Diamond")
        } else if (score >= 80) {
            string::utf8(b"Platinum") 
        } else if (score >= 70) {
            string::utf8(b"Gold")
        } else if (score >= 60) {
            string::utf8(b"Silver")
        } else {
            string::utf8(b"Bronze")
        }
    }

    #[view]
    public fun get_badge_info(badge: &TrustBadge): (address, string::String, u64, url::Url, u64) {
        (
            badge.owner,
            copy badge.badge_type,
            badge.trust_score,
            copy badge.metadata_url,
            badge.version
        )
    }
}