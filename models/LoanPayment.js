"use strict";

module.exports = (sequelize, DataTypes) => {
    const LoanPayment = sequelize.define(
        "LoanPayment",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            loan_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "Loans",
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            amount_paid: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
            },
            payment_date: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: "loan_payments",
            timestamps: true,
            underscored: true,
        }
    );

    LoanPayment.associate = function(models) {
        LoanPayment.belongsTo(models.Loan, {
            foreignKey: "loan_id",
            as: "loan",
        });
    };

    return LoanPayment;
};
