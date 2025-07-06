// models/admin.js

module.exports = (sequelize, DataTypes) => {
    const Admin = sequelize.define(
        "Admin",
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            profile_image_url: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            password_hash: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            role: {
                type: DataTypes.ENUM("superadmin", "admin"),
                defaultValue: "admin",
            },
        },
        {
            tableName: "Admins",
            timestamps: true,
            paranoid: true, // enables deletedAt
            underscored: true,
        }
    );

    return Admin;
};
