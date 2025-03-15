from flask import Blueprint
from backend.api.controllers.account_controller import (
    get_accounts, get_account, create_account, update_account, delete_account
)
from backend.api.routes.auth_routes import token_required

# Create a Blueprint for account routes
account_bp = Blueprint('account', __name__, url_prefix='/api/accounts')

# Register routes
account_bp.route('', methods=['GET'])(token_required(get_accounts))
account_bp.route('/<account_id>', methods=['GET'])(token_required(get_account))
account_bp.route('', methods=['POST'])(token_required(create_account))
account_bp.route('/<account_id>', methods=['PUT'])(token_required(update_account))
account_bp.route('/<account_id>', methods=['DELETE'])(token_required(delete_account))