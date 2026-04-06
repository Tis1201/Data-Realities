# Documentation

**Last Updated**: 2026-03-30  
**Status**: ✅ Professional & Consolidated

This directory contains **user-facing documentation** for the IoT Management System (Fleet Management): end-user and administrator guides for the web application. Content is organized for **easy navigation** and mirrors the main `docs/user_guides` tree.

---

## 📚 Core Documentation

### 👤 [User Guides — End Users](./user_guides/user/README.md)
**Day-to-day product usage for account users**
- **Dashboard & Overview** - Statistics, charts, and health thresholds
- **IoT** - Devices, tags, profiles, bundles, preclaims, PIN rules
- **Integrations** - WhatsApp and related flows
- **Analytics** - Logs and activity
- **Resources** - Files and assets for devices
- **Settings** - Account, users, and profile

### 🛡️ [User Guides — Administrators](./user_guides/admin/README.md)
**System and tenant administration**
- **Access** - Accounts, companies, groups, users
- **Billing** - Licenses and JWT-related flows
- **IoT** - Devices, bundles, profiles, factory tokens, preclaims, resources, tags, PIN rules
- **Integrations** - Webhooks, listeners, WhatsApp
- **Security** - API keys, signing keys
- **Settings** - General and email configuration
- **Operations** - Monitor, preview, debug, streams, token logs, Redis/SSE/messaging tools

### 📋 [User Documentation Index](./user_guides/README.md)
**Short index** - Dashboard entry point and support note

---

## 🚀 Quick Start

### For End Users
1. **Start with [User Guides — End Users](./user_guides/user/README.md)** - Feature map and quick start
2. **Open [Dashboard](./user_guides/user/dashboard.md)** - Main overview and metrics
3. **Use [Devices](./user_guides/user/iot/devices.md)** - Core device workflows

### For Administrators
1. **Start with [User Guides — Administrators](./user_guides/admin/README.md)** - Admin feature map and workflows
2. **Review [Device Management](./user_guides/admin/iot/devices.md)** - Lifecycle and operations
3. **Check [Access](./user_guides/admin/access/accounts.md)** - Accounts, companies, and users as needed

### For Testers & QA
1. **Use [End User](./user_guides/user/README.md) and [Admin](./user_guides/admin/README.md) guides** - Expected behavior by role
2. **Follow scenario sections** in each guide (timeouts, flows, success/failure cases where documented)

---

## 📁 Supporting Documentation

This bundle **only** includes user guides under `./user_guides/`. It does **not** include:

- **Architecture** - System design (`docs/architecture/`)
- **API** - REST and integration references (`docs/api/`)
- **Developer guides** - CRUD, listing tables, implementation patterns (`docs/guides/`)
- **Testing** - Load testing and engineering test strategy (`docs/testing/`)
- **Troubleshooting** - Operations runbooks (`docs/TROUBLESHOOTING.md`)

For full technical documentation, use the repository **`docs/`** tree at the project root.

---

## 📊 System Overview

The IoT Management System (Fleet Management) helps teams:

- **📱 Manage devices** - Register, claim, tag, and operate fleets at scale
- **📦 Deploy software** - Bundles, profiles, and resource distribution
- **⚡ Monitor activity** - Dashboards, logs, and admin tooling
- **🔒 Control access** - Accounts, companies, groups, PIN rules, and security settings
- **🔗 Integrate** - Webhooks, listeners, WhatsApp, and related services

---

## 🔄 Recent Updates

- **2026-03-30**: ✅ **README** - Added root index aligned with `docs/README.md` format
- **2025-10-12**: ✅ **User guides** - Consolidated end-user and admin navigation and feature maps

---

## 📝 Documentation Standards

- **✅ Last Updated**: Section or document timestamps where present
- **✅ Clear audience**: End user vs administrator
- **✅ Step-by-step flows**: Where features require sequences of actions
- **✅ Visual diagrams**: Flow diagrams in admin guides where applicable
- **✅ Timeouts & behavior**: Operational limits documented in user README where listed

---

## 🤝 Contributing

When adding or updating documentation in this folder:

1. **Place content under `./user_guides/`** following the existing `user/` vs `admin/` split
2. **Update the relevant [User](./user_guides/user/README.md) or [Admin](./user_guides/admin/README.md) README** when adding major sections
3. **Update this README** if you add new top-level categories
4. **Keep paths relative** so this bundle stays portable

---

## 🎯 Key Benefits

### Focused bundle
- ✅ **Role-based guides** - End users and admins separated clearly
- ✅ **No developer noise** - Implementation guides live in `docs/guides/`
- ✅ **Portable** - Suitable for sharing with testers, trainers, or partners

### Relationship to `docs/`
- ✅ **Superset** - Root `docs/` includes architecture, API, testing, and troubleshooting
- ✅ **This folder** - User-guide slice only, same format style as `docs/README.md`

---

*For technical architecture, APIs, and troubleshooting, see `docs/README.md` at the project root. For questions about these guides, contact the development team.*
