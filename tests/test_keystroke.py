import unittest
from src.dashboard.services.keystroke_verification import KeystrokeVerifier

class TestKeystrokeVerification(unittest.TestCase):
    def setUp(self):
        self.verifier = KeystrokeVerifier()

    def test_canonicalize_event(self):
        event = {
            "sequence": 1,
            "keyDownTime": 1000,
            "keyUpTime": 1050,
            "holdTime": 50,
            "interKeyGap": 20
        }
        canonical = self.verifier.canonicalize_event(event)
        self.assertEqual(canonical, "1|1000|1050|50|20")

    def test_canonicalize_event_null_ikg(self):
        event = {
            "sequence": 0,
            "keyDownTime": 1000,
            "keyUpTime": 1050,
            "holdTime": 50,
            "interKeyGap": None
        }
        canonical = self.verifier.canonicalize_event(event)
        self.assertEqual(canonical, "0|1000|1050|50|null")

    def test_merkle_root_empty(self):
        root = self.verifier.generate_merkle_root([])
        expected = self.verifier.sha256("empty")
        self.assertEqual(root, expected)

    def test_merkle_root_single_event(self):
        events = [{
            "sequence": 0,
            "keyDownTime": 1000,
            "keyUpTime": 1050,
            "holdTime": 50,
            "interKeyGap": None
        }]
        canonical = "0|1000|1050|50|null"
        expected = self.verifier.sha256(canonical)
        
        root = self.verifier.generate_merkle_root(events)
        self.assertEqual(root, expected)

    def test_merkle_root_multiple_events(self):
        events = [
            {"sequence": 0, "keyDownTime": 100, "keyUpTime": 150, "holdTime": 50, "interKeyGap": None},
            {"sequence": 1, "keyDownTime": 170, "keyUpTime": 220, "holdTime": 50, "interKeyGap": 20}
        ]
        
        h1 = self.verifier.sha256("0|100|150|50|null")
        h2 = self.verifier.sha256("1|170|220|50|20")
        expected_root = self.verifier.sha256(h1 + h2)
        
        root = self.verifier.generate_merkle_root(events)
        self.assertEqual(root, expected_root)

    def test_merkle_root_odd_events(self):
        events = [
            {"sequence": 0, "keyDownTime": 100, "keyUpTime": 150, "holdTime": 50, "interKeyGap": None},
            {"sequence": 1, "keyDownTime": 170, "keyUpTime": 220, "holdTime": 50, "interKeyGap": 20},
            {"sequence": 2, "keyDownTime": 250, "keyUpTime": 300, "holdTime": 50, "interKeyGap": 30}
        ]
        
        h1 = self.verifier.sha256("0|100|150|50|null")
        h2 = self.verifier.sha256("1|170|220|50|20")
        h3 = self.verifier.sha256("2|250|300|50|30")
        
        h12 = self.verifier.sha256(h1 + h2)
        h33 = self.verifier.sha256(h3 + h3)
        expected_root = self.verifier.sha256(h12 + h33)
        
        root = self.verifier.generate_merkle_root(events)
        self.assertEqual(root, expected_root)

    def test_verify_payload_valid(self):
        events = [
            {"sequence": 0, "keyDownTime": 100, "keyUpTime": 150, "holdTime": 50, "interKeyGap": None},
            {"sequence": 1, "keyDownTime": 170, "keyUpTime": 220, "holdTime": 50, "interKeyGap": 20}
        ]
        client_root = self.verifier.generate_merkle_root(events)
        
        payload = {
            "events": events,
            "clientMerkleRoot": client_root
        }
        
        result = self.verifier.verify_payload(payload)
        self.assertEqual(result["integrity"], "VALID")
        self.assertFalse(result["anomaly"])

    def test_verify_payload_tampered(self):
        events = [
            {"sequence": 0, "keyDownTime": 100, "keyUpTime": 150, "holdTime": 50, "interKeyGap": None}
        ]
        
        payload = {
            "events": events,
            "clientMerkleRoot": "fake_root"
        }
        
        result = self.verifier.verify_payload(payload)
        self.assertEqual(result["integrity"], "TAMPERED")

if __name__ == '__main__':
    unittest.main()
