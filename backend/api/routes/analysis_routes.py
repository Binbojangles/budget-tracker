from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
from backend.api.routes.auth_routes import token_required
from backend.services.analyzers.spending_analyzer import SpendingAnalyzer
from backend.services.recommendations.budget_recommendations import BudgetRecommendationService

# Create a Blueprint for analysis routes
analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/analysis')

@analysis_bp.route('/spending-by-category', methods=['GET'])
@token_required
def get_spending_by_category():
    """Get spending breakdown by category."""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        account_id = request.args.get('account_id')
        
        # Parse dates if provided
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        else:
            start_date = datetime.now() - timedelta(days=30)  # Default to last 30 days
        
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
        else:
            end_date = datetime.now()
        
        # Get spending breakdown
        analyzer = SpendingAnalyzer(g.user_id)
        category_spending = analyzer.get_spending_by_category(start_date, end_date, account_id)
        
        # Convert DataFrame to JSON-friendly format
        result = category_spending.to_dict('records')
        
        return jsonify({
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'categories': result
        }), 200
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to analyze spending', 'details': str(e)}), 500

@analysis_bp.route('/monthly-trends', methods=['GET'])
@token_required
def get_monthly_trends():
    """Get monthly spending trends."""
    try:
        # Get query parameters
        months = request.args.get('months', default=6, type=int)
        
        # Get monthly trends
        analyzer = SpendingAnalyzer(g.user_id)
        monthly_trends = analyzer.get_monthly_spending_trends(months)
        
        # Convert DataFrame to JSON-friendly format
        if monthly_trends.empty:
            result = []
        else:
            result = monthly_trends.to_dict('records')
        
        return jsonify({
            'months': months,
            'trends': result
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to analyze monthly trends', 'details': str(e)}), 500

@analysis_bp.route('/largest-expenses', methods=['GET'])
@token_required
def get_largest_expenses():
    """Get largest individual expenses."""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', default=10, type=int)
        
        # Parse dates if provided
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        else:
            start_date = datetime.now() - timedelta(days=30)  # Default to last 30 days
        
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
        else:
            end_date = datetime.now()
        
        # Get largest expenses
        analyzer = SpendingAnalyzer(g.user_id)
        expenses = analyzer.get_largest_expenses(start_date, end_date, limit)
        
        # Convert DataFrame to JSON-friendly format
        if expenses.empty:
            result = []
        else:
            result = expenses.to_dict('records')
        
        return jsonify({
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'expenses': result
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve largest expenses', 'details': str(e)}), 500

@analysis_bp.route('/budget-comparison/<budget_id>', methods=['GET'])
@token_required
def get_budget_comparison(budget_id):
    """Compare actual spending with budget allocations."""
    try:
        # Get budget comparison
        analyzer = SpendingAnalyzer(g.user_id)
        comparison = analyzer.get_monthly_budget_comparison(budget_id)
        
        # Convert DataFrame to JSON-friendly format
        if comparison.empty:
            result = []
        else:
            result = comparison.to_dict('records')
        
        return jsonify({
            'budget_id': budget_id,
            'comparison': result
        }), 200
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to compare budget', 'details': str(e)}), 500

@analysis_bp.route('/recommendations/spending', methods=['GET'])
@token_required
def get_spending_recommendations():
    """Get spending recommendations."""
    try:
        # Get query parameters
        months = request.args.get('months', default=3, type=int)
        
        # Get recommendations
        analyzer = SpendingAnalyzer(g.user_id)
        recommendations = analyzer.get_spending_recommendations(months)
        
        return jsonify(recommendations), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to generate recommendations', 'details': str(e)}), 500

@analysis_bp.route('/recommendations/budget-plan', methods=['GET'])
@token_required
def get_budget_plan():
    """Get recommended budget plan."""
    try:
        # Get query parameters
        income = request.args.get('income', type=float)
        savings_goal = request.args.get('savings_goal', default=20, type=float)
        
        # Get budget plan
        recommendation_service = BudgetRecommendationService(g.user_id)
        budget_plan = recommendation_service.generate_budget_plan(income, savings_goal)
        
        return jsonify(budget_plan), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to generate budget plan', 'details': str(e)}), 500

@analysis_bp.route('/recommendations/cost-cutting', methods=['GET'])
@token_required
def get_cost_cutting_opportunities():
    """Get cost-cutting opportunities."""
    try:
        # Get opportunities
        recommendation_service = BudgetRecommendationService(g.user_id)
        opportunities = recommendation_service.identify_cost_cutting_opportunities()
        
        return jsonify(opportunities), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to identify cost-cutting opportunities', 'details': str(e)}), 500