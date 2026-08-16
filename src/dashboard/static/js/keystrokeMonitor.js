class KeystrokeMonitor {
    constructor(config = {}) {
        this.events = [];
        this.sequence = 0;
        this.activeKeys = new Map(); // key -> keydown timestamp
        this.lastKeyUpTime = null;
        this.config = {
            suspiciousIKGThreshold: config.suspiciousIKGThreshold || 25,
            minimumEventsForAnalysis: config.minimumEventsForAnalysis || 10,
        };
    }

    startMonitoring(targetElement = document) {
        targetElement.addEventListener('keydown', this.handleKeyDown.bind(this));
        targetElement.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleKeyDown(e) {
        if (e.repeat) return; // Ignore auto-repeat hold
        
        const timestamp = Date.now();
        // Use a generic id (e.code or e.key can be used just for matching keyup, but we won't store it)
        const keyId = e.code || e.key; 
        
        if (!this.activeKeys.has(keyId)) {
            this.activeKeys.set(keyId, timestamp);
        }
    }

    handleKeyUp(e) {
        const timestamp = Date.now();
        const keyId = e.code || e.key;

        if (this.activeKeys.has(keyId)) {
            const keyDownTime = this.activeKeys.get(keyId);
            const holdTime = timestamp - keyDownTime;
            
            let interKeyGap = null;
            if (this.lastKeyUpTime !== null) {
                interKeyGap = keyDownTime - this.lastKeyUpTime;
                if (interKeyGap < 0) {
                    interKeyGap = 0; // Handle edge cases where keydown happens before previous keyup but recorded out of order
                }
            }

            const eventRecord = {
                sequence: this.sequence++,
                keyDownTime: keyDownTime,
                keyUpTime: timestamp,
                holdTime: holdTime,
                interKeyGap: interKeyGap
            };

            this.events.push(eventRecord);
            this.lastKeyUpTime = timestamp;
            this.activeKeys.delete(keyId);
        }
    }

    getEvents() {
        return this.events;
    }

    getMetrics() {
        if (this.events.length === 0) return null;

        let totalHoldTime = 0;
        let totalIKG = 0;
        let ikgCount = 0;
        let suspiciousEvents = 0;
        
        const ikgs = [];

        this.events.forEach(e => {
            totalHoldTime += e.holdTime;
            if (e.interKeyGap !== null) {
                totalIKG += e.interKeyGap;
                ikgs.push(e.interKeyGap);
                ikgCount++;
                if (e.interKeyGap < this.config.suspiciousIKGThreshold) {
                    suspiciousEvents++;
                }
            }
        });

        const avgHoldTime = totalHoldTime / this.events.length;
        const avgIKG = ikgCount > 0 ? totalIKG / ikgCount : 0;

        // Variance
        let varianceIKG = 0;
        if (ikgCount > 1) {
            const sumSquaredDiff = ikgs.reduce((acc, val) => acc + Math.pow(val - avgIKG, 2), 0);
            varianceIKG = sumSquaredDiff / ikgCount;
        }

        let suspicionScore = 0;
        if (suspiciousEvents > this.config.minimumEventsForAnalysis) {
            suspicionScore += (suspiciousEvents / this.events.length) * 100;
        }
        if (ikgCount > this.config.minimumEventsForAnalysis && varianceIKG < 5) {
            suspicionScore += 50; // Near zero variance penalty
        }

        return {
            averageHoldTime: avgHoldTime,
            averageIKG: avgIKG,
            varianceIKG: varianceIKG,
            suspiciousEventCount: suspiciousEvents,
            suspicionScore: suspicionScore
        };
    }
}

// Export for module usage if needed, or attach to window
window.KeystrokeMonitor = KeystrokeMonitor;
