from flask import Blueprint
from backend.api.controllers.transaction_controller import (
    get_transactions, get_transaction, create_transaction, update_transaction, delete_transaction
)
from backend.api.routes.auth_routes import token_required

# Create a Blueprint for transaction routes
transaction_bp = Blueprint('transaction', __name__, url_prefix='/api/transactions')

# Register routes
transaction_bp.route('', methods=['GET'])(token_required(get_transactions))
transaction_bp.route('/<transaction_id>', methods=['GET'])(token_required(get_transaction))
transaction_bp.route('', methods=['POST'])(token_required(create_transaction))
transaction_bp.route('/<transaction_id>', methods=['PUT'])(token_required(update_transaction))
transaction_bp.route('/<transaction_id>', methods=['DELETE'])(token_required(delete_transaction))