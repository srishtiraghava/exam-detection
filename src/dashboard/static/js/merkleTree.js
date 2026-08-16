class MerkleTree {
    static async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static canonicalizeEvent(event) {
        // Deterministic serialization: sequence|keyDownTime|keyUpTime|holdTime|interKeyGap
        // Using 'null' string if interKeyGap is null.
        const ikg = event.interKeyGap === null ? 'null' : event.interKeyGap;
        return `${event.sequence}|${event.keyDownTime}|${event.keyUpTime}|${event.holdTime}|${ikg}`;
    }

    static async generateTree(events) {
        if (events.length === 0) {
            return await this.sha256("empty");
        }

        // Generate leaves
        let layer = [];
        for (let i = 0; i < events.length; i++) {
            const canonical = this.canonicalizeEvent(events[i]);
            const hash = await this.sha256(canonical);
            layer.push(hash);
        }

        // Build tree
        while (layer.length > 1) {
            let nextLayer = [];
            for (let i = 0; i < layer.length; i += 2) {
                if (i + 1 < layer.length) {
                    const left = layer[i];
                    const right = layer[i + 1];
                    // Concatenate left and right hash
                    const parentHash = await this.sha256(left + right);
                    nextLayer.push(parentHash);
                } else {
                    // Duplicate final hash if odd number of leaves
                    const left = layer[i];
                    const right = layer[i];
                    const parentHash = await this.sha256(left + right);
                    nextLayer.push(parentHash);
                }
            }
            layer = nextLayer;
        }

        return layer[0]; // Merkle Root
    }
}

window.MerkleTree = MerkleTree;
