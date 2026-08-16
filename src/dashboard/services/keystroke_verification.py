import hashlib
import json
import logging

class KeystrokeVerifier:
    def __init__(self):
        pass

    @staticmethod
    def sha256(message: str) -> str:
        return hashlib.sha256(message.encode('utf-8')).hexdigest()

    @staticmethod
    def canonicalize_event(event: dict) -> str:
        sequence = event.get('sequence')
        keyDownTime = event.get('keyDownTime')
        keyUpTime = event.get('keyUpTime')
        holdTime = event.get('holdTime')
        ikg = event.get('interKeyGap')
        
        # 'null' string for missing IKG as per JS implementation
        ikg_str = 'null' if ikg is None else str(ikg)
        
        return f"{sequence}|{keyDownTime}|{keyUpTime}|{holdTime}|{ikg_str}"

    @staticmethod
    def generate_merkle_root(events: list) -> str:
        if not events:
            return KeystrokeVerifier.sha256("empty")
            
        layer = []
        for event in events:
            canonical = KeystrokeVerifier.canonicalize_event(event)
            layer.append(KeystrokeVerifier.sha256(canonical))
            
        while len(layer) > 1:
            next_layer = []
            for i in range(0, len(layer), 2):
                if i + 1 < len(layer):
                    left = layer[i]
                    right = layer[i+1]
                    next_layer.append(KeystrokeVerifier.sha256(left + right))
                else:
                    # Duplicate the last hash if odd number of leaves
                    left = layer[i]
                    right = layer[i]
                    next_layer.append(KeystrokeVerifier.sha256(left + right))
            layer = next_layer
            
        return layer[0]

    def verify_payload(self, payload: dict) -> dict:
        events = payload.get('events', [])
        client_root = payload.get('clientMerkleRoot')
        
        # 1. Server-side recomputation of the Merkle root
        server_root = self.generate_merkle_root(events)
        
        is_tampered = client_root != server_root
        
        # 2. Server-side recalculation of metrics to detect anomalies independently
        total_ikg = 0
        ikg_count = 0
        ikgs = []
        suspicious_threshold = 25
        suspicious_count = 0
        
        for e in events:
            ikg = e.get('interKeyGap')
            if ikg is not None:
                total_ikg += ikg
                ikg_count += 1
                ikgs.append(ikg)
                if ikg < suspicious_threshold:
                    suspicious_count += 1
                    
        avg_ikg = total_ikg / ikg_count if ikg_count > 0 else 0
        variance = 0
        if ikg_count > 1:
            variance = sum((x - avg_ikg) ** 2 for x in ikgs) / ikg_count
            
        anomaly = False
        if ikg_count > 10 and variance < 5:
            anomaly = True # Unusually low variance - possibly automated
            
        if ikg_count > 10 and (suspicious_count / ikg_count) > 0.5:
            anomaly = True # Too many impossibly fast inter-key gaps
            
        return {
            "integrity": "TAMPERED" if is_tampered else "VALID",
            "serverRoot": server_root,
            "anomaly": anomaly,
            "metrics": {
                "avg_ikg": round(avg_ikg, 2),
                "variance": round(variance, 2),
                "suspicious_events": suspicious_count
            }
        }
