"use strict";

module.exports = (sequelize, DataTypes) => {
    const Loan = sequelize.define(
        "Loan",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            wallet_id: { type: DataTypes.STRING, allowNull: false },
            amount: { type: DataTypes.DOUBLE, allowNull: false },
            interest_amount: { type: DataTypes.DOUBLE, allowNull: false },
            total_payable: { type: DataTypes.DOUBLE, allowNull: false },
            reason: DataTypes.TEXT,
            return_date: DataTypes.DATE,
            status: {
                type: DataTypes.ENUM("pending", "processing", "approved", "paid","rejected"),
                defaultValue: "pending",
            },            rejection_reason: DataTypes.TEXT,
        },
        {
            tableName: "Loans",
            timestamps: true,
            underscored: true,
        }
    );

    Loan.associate = function(models) {
        Loan.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
        });

        Loan.belongsTo(models.Wallet, {
            foreignKey: "wallet_id",
            targetKey: "wallet_id",
            as: "wallet",
        });
    };

    return Loan;
};
