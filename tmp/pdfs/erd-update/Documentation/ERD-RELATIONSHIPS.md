# Connected ERD relationship register

Internal application-schema relationships only. USER_ACCOUNT.account_id will map to Supabase auth.users.id; Auth is an external integration boundary and is not counted as an application entity.

Left cardinality = parents per child; right = children per parent. Numeric maxima follow FK nullability and uniqueness. Lifecycle minima are enforced by the documented rules, not by an ordinary FK alone.

| ID | Parent PK | Parents per child | Child FK | Children per parent | Definition pages |
| --- | --- | --- | --- | --- | --- |
| R01 | STUDENT.student_id | 0..1 | USER_ACCOUNT.student_id | 0..1 | A1 / A1 |
| R02 | LABORATORY.lab_id | 0..1 | USER_ACCOUNT.staff_lab_id | 0..* | A3 / A1 |
| R03 | USER_ACCOUNT.account_id | 1 | FACULTY_SECTION.faculty_id | 0..* | A1 / A2 |
| R04 | SECTION.section_id | 1 | FACULTY_SECTION.section_id | 0..* | A1 / A2 |
| R05 | LABORATORY.lab_id | 1 | FACULTY_SECTION.lab_id | 0..* | A3 / A2 |
| R06 | TERM.term_id | 1 | CLASS_GROUP.term_id | 0..* | A3 / A2 |
| R07 | FACULTY_SECTION.faculty_section_id | 1 | CLASS_GROUP.faculty_section_id | 0..* | A2 / A2 |
| R08 | USER_ACCOUNT.account_id | 1 | CLASS_REP_ASSIGNMENT.account_id | 0..* | A1 / A2 |
| R09 | SECTION.section_id | 1 | CLASS_REP_ASSIGNMENT.section_id | 0..* | A1 / A2 |
| R10 | CLASS_GROUP.group_id | 1 | CLASS_REP_ASSIGNMENT.group_id | 0..* | A2 / A2 |
| R11 | CLASS_GROUP.group_id | 1 | GROUP_MEMBER.group_id | 0..* | A2 / A2 |
| R12 | STUDENT.student_id | 1 | GROUP_MEMBER.student_id | 0..* | A1 / A2 |
| R13 | LABORATORY.lab_id | 1 | LAB_ROOM.lab_id | 0..* | A3 / A3 |
| R14 | TERM.term_id | 1 | REGULAR_SCHEDULE.term_id | 0..* | A3 / A3 |
| R15 | LAB_ROOM.room_id | 1 | REGULAR_SCHEDULE.room_id | 0..* | A3 / A3 |
| R16 | CLASS_GROUP.group_id | 0..1 | REGULAR_SCHEDULE.group_id | 0..* | A2 / A3 |
| R17 | USER_ACCOUNT.account_id | 1 | SERVICE_REQUEST.requester_id | 0..* | A1 / A4 |
| R18 | SERVICE_REQUEST.request_id | 1 | REQUEST_REVISION.request_id | 0..* | A4 / A4 |
| R19 | LABORATORY.lab_id | 1 | REQUEST_REVISION.lab_id | 0..* | A3 / A4 |
| R20 | CLASS_GROUP.group_id | 1 | REQUEST_REVISION.group_id | 0..* | A2 / A4 |
| R21 | LAB_ROOM.room_id | 1 | REQUEST_REVISION.room_id | 0..* | A3 / A4 |
| R22 | REGULAR_SCHEDULE.regular_schedule_id | 0..1 | REQUEST_REVISION.regular_schedule_id | 0..* | A3 / A4 |
| R23 | USER_ACCOUNT.account_id | 1 | REQUEST_REVISION.created_by | 0..* | A1 / A4 |
| R24 | REQUEST_REVISION.revision_id | 1 | APPROVAL.revision_id | 0..1 | A4 / A5 |
| R25 | USER_ACCOUNT.account_id | 1 | APPROVAL.approver_id | 0..* | A1 / A5 |
| R26 | REQUEST_REVISION.revision_id | 1 | REQUEST_ITEM.revision_id | 0..* | A4 / A5 |
| R27 | ITEM.item_id | 0..1 | REQUEST_ITEM.item_id | 0..* | A6 / A5 |
| R28 | REQUEST_REVISION.revision_id | 1 | REQUEST_MEMBER.revision_id | 0..* | A4 / A5 |
| R29 | STUDENT.student_id | 1 | REQUEST_MEMBER.student_id | 0..* | A1 / A5 |
| R30 | REQUEST_REVISION.revision_id | 1 | RESERVATION.revision_id | 0..1 | A4 / A5 |
| R31 | USER_ACCOUNT.account_id | 1 | RESERVATION.processed_by | 0..* | A1 / A5 |
| R32 | LABORATORY.lab_id | 1 | ITEM.lab_id | 0..* | A3 / A6 |
| R33 | ITEM_CATEGORY.category_id | 1 | ITEM.category_id | 0..* | A6 / A6 |
| R34 | ITEM.item_id | 1 | STOCK_MOVEMENT.item_id | 0..* | A6 / A6 |
| R35 | USER_ACCOUNT.account_id | 1 | STOCK_MOVEMENT.recorded_by | 0..* | A1 / A6 |
| R36 | BORROWING_ITEM.borrowing_item_id | 0..1 | STOCK_MOVEMENT.borrowing_item_id | 0..* | A7 / A6 |
| R37 | RETURN_ENTRY.return_entry_id | 0..1 | STOCK_MOVEMENT.return_entry_id | 0..* | A7 / A6 |
| R38 | DISPOSAL.disposal_id | 0..1 | STOCK_MOVEMENT.disposal_id | 0..* | A6 / A6 |
| R39 | ITEM.item_id | 1 | DISPOSAL.item_id | 0..* | A6 / A6 |
| R40 | USER_ACCOUNT.account_id | 1 | DISPOSAL.recorded_by | 0..* | A1 / A6 |
| R41 | RETURN_ENTRY.return_entry_id | 0..1 | DISPOSAL.return_entry_id | 0..* | A7 / A6 |
| R42 | RESERVATION.reservation_id | 1 | BORROWING.reservation_id | 0..* | A5 / A7 |
| R43 | USER_ACCOUNT.account_id | 1 | BORROWING.borrower_account_id | 0..* | A1 / A7 |
| R44 | USER_ACCOUNT.account_id | 1 | BORROWING.issued_by | 0..* | A1 / A7 |
| R45 | BORROWING.borrowing_id | 1 | BORROWING_ITEM.borrowing_id | 0..* | A7 / A7 |
| R46 | REQUEST_ITEM.request_item_id | 1 | BORROWING_ITEM.request_item_id | 0..* | A5 / A7 |
| R47 | ITEM.item_id | 1 | BORROWING_ITEM.item_id | 0..* | A6 / A7 |
| R48 | BORROWING.borrowing_id | 1 | BORROWING_MEMBER.borrowing_id | 0..* | A7 / A7 |
| R49 | REQUEST_MEMBER.request_member_id | 1 | BORROWING_MEMBER.request_member_id | 0..* | A5 / A7 |
| R50 | BORROWING_ITEM.borrowing_item_id | 1 | RETURN_ENTRY.borrowing_item_id | 0..* | A7 / A7 |
| R51 | USER_ACCOUNT.account_id | 1 | RETURN_ENTRY.received_by | 0..* | A1 / A7 |
| R52 | RETURN_ENTRY.return_entry_id | 1 | CLEARANCE.return_entry_id | 0..* | A7 / A8 |
| R53 | BORROWING_MEMBER.borrow_member_id | 1 | CLEARANCE.borrow_member_id | 0..* | A7 / A8 |
| R54 | USER_ACCOUNT.account_id | 1 | CLEARANCE.raised_by | 0..* | A1 / A8 |
| R55 | USER_ACCOUNT.account_id | 0..1 | CLEARANCE.settled_by | 0..* | A1 / A8 |
| R56 | RESERVATION.reservation_id | 1 | USAGE_LOG.reservation_id | 0..* | A5 / A8 |
| R57 | BORROWING.borrowing_id | 0..1 | USAGE_LOG.borrowing_id | 0..* | A7 / A8 |
| R58 | USER_ACCOUNT.account_id | 1 | USAGE_LOG.recorded_by | 0..* | A1 / A8 |
| R59 | LABORATORY.lab_id | 1 | DAILY_TASK.lab_id | 0..* | A3 / A8 |
| R60 | USER_ACCOUNT.account_id | 1 | DAILY_TASK.recorded_by | 0..* | A1 / A8 |
| R61 | USER_ACCOUNT.account_id | 1 | CHAT_EXCHANGE.requester_id | 0..* | A1 / A9 |
