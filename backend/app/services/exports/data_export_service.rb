require "csv"

module Exports
  class DataExportService
    def export_users(format: "json")
      users = User.includes(:wallet).order(:created_at)

      if format == "csv"
        generate_csv(users, user_headers) { |user| user_row(user) }
      else
        users.map { |u| user_json(u) }
      end
    end

    def export_investments(format: "json")
      investments = Investment.includes(:user, :investment_project).order(:created_at)

      if format == "csv"
        generate_csv(investments, investment_headers) { |inv| investment_row(inv) }
      else
        investments.map { |i| investment_json(i) }
      end
    end

    def export_transactions(format: "json")
      transactions = Transaction.includes(wallet: :user).order(:created_at)

      if format == "csv"
        generate_csv(transactions, transaction_headers) { |txn| transaction_row(txn) }
      else
        transactions.map { |t| transaction_json(t) }
      end
    end

    private

    def generate_csv(records, headers)
      CSV.generate do |csv|
        csv << headers
        records.find_each { |record| csv << yield(record) }
      end
    end

    # Users
    def user_headers
      %w[id email first_name last_name role kyc_status wallet_balance_cents created_at]
    end

    def user_row(user)
      [user.id, user.email, user.first_name, user.last_name, user.role,
       user.kyc_status, user.wallet&.balance_cents, user.created_at]
    end

    def user_json(user)
      { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name,
        role: user.role, kyc_status: user.kyc_status, wallet_balance_cents: user.wallet&.balance_cents,
        created_at: user.created_at }
    end

    # Investments
    def investment_headers
      %w[id user_email project_title amount_cents shares_count status invested_at]
    end

    def investment_row(inv)
      [inv.id, inv.user.email, inv.investment_project.title, inv.amount_cents,
       inv.shares_count, inv.status, inv.invested_at]
    end

    def investment_json(inv)
      { id: inv.id, user_email: inv.user.email, project_title: inv.investment_project.title,
        amount_cents: inv.amount_cents, shares_count: inv.shares_count, status: inv.status,
        invested_at: inv.invested_at }
    end

    # Transactions
    def transaction_headers
      %w[id user_email transaction_type amount_cents balance_after_cents status reference created_at]
    end

    def transaction_row(txn)
      [txn.id, txn.wallet.user.email, txn.transaction_type, txn.amount_cents,
       txn.balance_after_cents, txn.status, txn.reference, txn.created_at]
    end

    def transaction_json(txn)
      { id: txn.id, user_email: txn.wallet.user.email, transaction_type: txn.transaction_type,
        amount_cents: txn.amount_cents, balance_after_cents: txn.balance_after_cents,
        status: txn.status, reference: txn.reference, created_at: txn.created_at }
    end
  end
end
