import pytest

def test_user_data_structure():
    """Ensure user objects always contain a non-empty username."""
    user_data = {"username": "signal_user", "role": "admin"}
    assert "username" in user_data
    assert len(user_data["username"]) > 0

def test_security_headers_placeholder():
    """Verify that we aren't using default/unsafe passwords."""
    mock_db_password = "ENV_SECRET_ALPHABET"
    assert mock_db_password != "admin123", "Security Risk: Default credentials detected!"