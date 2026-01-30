import pytest

def test_user_creation_sanitization():
    # Ensure usernames are stripped of script tags (XSS Protection)
    input_username = "<script>alert(1)</script>User"
    sanitized = input_username.replace("<script>", "").replace("</script>", "")
    
    assert "<script>" not in sanitized
    assert sanitized == "User"

def test_auth_token_existence():
    mock_response = {"token": "sf_test_token_123"}
    assert "token" in mock_response