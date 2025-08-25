# SimpleBill — Feature Requirements & Status

## Overview

This document lists all features for the SimpleBill application with their current status and descriptions. Features are listed in no particular order - categorization and prioritization will be added later.

---

## Feature List

### Authentication & User Management

1. **Google Sign-in Integration**
   - **Status**: ✅ Implemented
   - **Description**: Users can sign in using their Google account for secure authentication

2. **User Profile Management**
   - **Status**: ✅ Implemented
   - **Description**: Users can view and manage their profile information

### Document Management

3. **Document Creation (Invoices & Quotations)**
   - **Status**: ✅ Implemented
   - **Description**: Create new invoices and quotations with customer and item selection

4. **Document Editing**
   - **Status**: ✅ Implemented
   - **Description**: Edit existing documents before finalization

5. **Draft vs Finalized Document States**
   - **Status**: ✅ Implemented
   - **Description**: Save documents as drafts or finalize them when ready

6. **Document Download (PDF)**
   - **Status**: ✅ Implemented
   - **Description**: Download finalized documents as PDFs using pdf-lib

7. **Quotation to Invoice Conversion**
   - **Status**: ✅ Implemented
   - **Description**: Convert finalized quotations into invoices

8. **Multiple Invoice Creation from Quotation**
   - **Status**: ✅ Implemented
   - **Description**: Create multiple invoices from the same quotation

9. **Document Numbering System**
   - **Status**: ✅ Implemented
   - **Description**: Automatic document numbering with customizable formats

10. **Document Status Management**
    - **Status**: ✅ Implemented
    - **Description**: Track document status (Draft, Finalized, Sent, Paid, Cancelled, Pending)

11. **Document Relationships & Navigation**
    - **Status**: ✅ Implemented
    - **Description**: Show and navigate between related documents (quotations and their invoices)

12. **Document Templates**
    - **Status**: ❌ Out of Scope
    - **Description**: Pre-built templates for different business types

13. **Document Versioning**
    - **Status**: ⏳ Planned
    - **Description**: Track document changes and allow reverting to previous versions

14. **Document Modification Tracking**
    - **Status**: ❌ Out of Scope
    - **Description**: Track when documents were last modified with timestamps

15. **"Revert to Previous Version" Option**
    - **Status**: ❌ Out of Scope
    - **Description**: Undo changes to documents with version control

16. **"Copy from Previous" Document Option**
    - **Status**: ⏳ Planned
    - **Description**: Duplicate recent documents quickly with pre-filled data

17. **"Duplicate" Button for Documents**
    - **Status**: ⏳ Planned
    - **Description**: One-click document duplication functionality

18. **Bulk Document Operations**
    - **Status**: ❌ Out of Scope
    - **Description**: Export multiple documents and bulk status updates

### Customer Management

19. **Customer Creation & Editing**
    - **Status**: ✅ Implemented
    - **Description**: Add and edit customer information with address support

20. **Customer List Management**
    - **Status**: ✅ Implemented
    - **Description**: View and manage all customers in a table format

21. **Auto-suggest Customer Names**
    - **Status**: ⏳ Planned
    - **Description**: Google-style search suggestions as you type customer names

22. **Customer Categories**
    - **Status**: ⏳ Planned
    - **Description**: Group customers by type (individual, business)

### Item Management

23. **Item Creation & Editing**
    - **Status**: ✅ Implemented
    - **Description**: Create and edit products/services with pricing

24. **Item List Management**
    - **Status**: ✅ Implemented
    - **Description**: View and manage all items in a table format

25. **Remember Frequently Used Items**
    - **Status**: ⏳ Planned
    - **Description**: Suggest frequently used items first in selection lists

26. **Item Categories**
    - **Status**: ⏳ Planned
    - **Description**: Organize items by category or service type

27. **Pricing Tiers**
    - **Status**: ❌ Out of Scope
    - **Description**: Different pricing for different customer types

### Dashboard & Navigation

28. **Dashboard with Recent Documents**
    - **Status**: ✅ Implemented
    - **Description**: View recent documents with status tracking and actions

29. **Left Sidebar Navigation**
    - **Status**: ✅ Implemented
    - **Description**: AppShell with consistent navigation across all pages

30. **Responsive Design**
    - **Status**: ✅ Implemented
    - **Description**: Mobile-friendly interface with adaptive layout

31. **Enhanced Dashboard Empty States**
    - **Status**: ⏳ Planned
    - **Description**: Improved empty states with user guidance

### User Experience & Interface

32. **Rough.js Styling**
    - **Status**: ✅ Implemented
    - **Description**: Hand-drawn aesthetic throughout the UI with sketch-style components

33. **Line-art SVG Icons**
    - **Status**: ⏳ Planned
    - **Description**: Minimal, accessible action icons for edit/delete operations

34. **Color-coded Status Badges**
    - **Status**: ✅ Implemented
    - **Description**: Visual status indicators (green/paid, yellow/pending, red/overdue)

35. **Progress Indicators**
    - **Status**: ⏳ Planned
    - **Description**: Show document workflow progress (draft → finalized → sent → paid)

36. **Visual Relationship Indicators**
    - **Status**: ⏳ Planned
    - **Description**: Clear indication of quotation → invoice connections

37. **Typography and Design Tokens**
    - **Status**: ✅ Implemented
    - **Description**: Consistent typography with Caveat for headings and Atkinson Hyperlegible for body text

### Smart Features & Automation

38. **Auto-calculate Totals**
    - **Status**: ⏳ Planned
    - **Description**: Auto-calculate totals as you add line items

39. **Suggest Common Item Descriptions**
    - **Status**: ⏳ Planned
    - **Description**: Suggest item descriptions based on previous usage

40. **"Mark as Paid" Simple Click Action**
    - **Status**: ⏳ Planned
    - **Description**: Single-click payment status update

41. **Quotation Age Notifications**
    - **Status**: ⏳ Planned
    - **Description**: Dashboard notifications for old quotations

### Financial Features

42. **Payment Tracking**
    - **Status**: ❌ Out of Scope
    - **Description**: Track payment status and due dates

43. **Tax Calculations**
    - **Status**: ❌ Out of Scope
    - **Description**: Built-in tax calculation and reporting

44. **Financial Reports**
    - **Status**: ❌ Out of Scope
    - **Description**: Revenue reports and outstanding payments tracking

45. **Currency Support**
    - **Status**: ❌ Out of Scope
    - **Description**: Multiple currency support for international clients

### Security & Compliance

46. **Data Encryption**
    - **Status**: 🔄 In Progress
    - **Description**: Client-side encryption for sensitive data stored in Firestore

47. **User Data Privacy Compliance**
    - **Status**: ⏳ Planned
    - **Description**: GDPR compliance and data protection regulations

48. **Access Control**
    - **Status**: ❌ Out of Scope
    - **Description**: Role-based permissions (admin, user, viewer)

49. **Audit Trail**
    - **Status**: ❌ Out of Scope
    - **Description**: Track document changes and user actions

50. **Data Retention**
    - **Status**: ⏳ Planned
    - **Description**: Auto-archive old documents with configurable retention policies

### Support & Help

51. **User Support System**
    - **Status**: ⏳ Planned
    - **Description**: FAQ section and GitHub issue creation flow for support requests

52. **Terms of Service**
    - **Status**: ✅ Implemented
    - **Description**: Terms link on login page (needs actual content)

### Advanced Features

53. **Recurring Invoices**
    - **Status**: ⏳ Planned
    - **Description**: Automatically generate recurring invoices

54. **Inventory Tracking**
    - **Status**: ❌ Out of Scope
    - **Description**: Track item stock levels

55. **Custom Branding**
    - **Status**: ⏳ Planned
    - **Description**: Allow users to customize colors, logos, fonts

56. **Email Integration**
    - **Status**: ❌ Out of Scope
    - **Description**: Send documents directly via email

57. **Data Export**
    - **Status**: ⏳ Planned
    - **Description**: Export data to CSV, Excel formats

58. **Offline Support**
    - **Status**: ⏳ Planned
    - **Description**: Work without internet connection

59. **Mobile App**
    - **Status**: ❌ Out of Scope
    - **Description**: Native mobile applications

60. **Multi-language Support**
    - **Status**: ⏳ Planned
    - **Description**: Internationalization for different languages

### Settings & Configuration

61. **Document Numbering Format Settings**
    - **Status**: ⏳ Planned
    - **Description**: Customizable document numbering patterns in settings

62. **User Preferences**
    - **Status**: ⏳ Planned
    - **Description**: User-configurable settings and preferences

---

## Status Legend

- ✅ **Implemented**: Feature is complete and functional
- 🔄 **In Progress**: Feature is currently being developed
- ⏳ **Planned**: Feature is identified but not yet started
- ❌ **Out of Scope**: Feature is not planned for implementation

---

## Summary

**Total Features**: 62

- **Implemented**: 18 features (29%)
- **In Progress**: 1 feature (2%)
- **Planned**: 32 features (52%)
- **Out of Scope**: 11 features (18%)

This list will be updated as features are implemented and new requirements are identified. Categorization and prioritization will be added in future updates.
