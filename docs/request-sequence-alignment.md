# Request sequence alignment

Reviewed against the current Class Representative and Faculty UI on September 27, 2026. The latest requested UI behavior is the basis for this alignment.

This is a review and replacement sequence draft inside the System workspace. The existing Documentation diagrams and exported PDFs still contain the older routes; regenerate them after applying the changes below.

## Findings in the existing sequence

| Source | Existing behavior | Required alignment |
| --- | --- | --- |
| `../../Documentation/assets/system-diagrams/sequence-models.js`, SEQ-02, Faculty/Dean guards and note | Classrep Out-of-Schedule automatically routes to available Faculty, otherwise Dean | Review offers an explicit assigned Faculty / Dean choice. Submission validates and records that one recipient. Faculty availability is no longer the UI condition for choosing Dean. |
| Same file, SEQ-02 note | Neither Faculty activity variant has a separate Schedule & Room Availability page | Laboratory Activity uses its assigned Schedule & Room step; Non-Laboratory Activity adds Schedule Type before Schedule & Room. Both then use Equipment & Materials and Review. |
| `../../Documentation/assets/system-diagrams/whole-sequence.js`, page 1 requester and approval alternatives | Classrep route uses Faculty availability; Faculty submit label does not distinguish activity branches | Use the role/activity/schedule alternatives below. Faculty Laboratory Activity cannot carry an Out-of-Schedule draft. |
| `../../Documentation/assets/system-diagrams/SEQUENCE-PLAN.md` and `TRACEABILITY.md` | Repeat automatic Classrep routing and Faculty room-page omission | Update alongside SEQ-02 and the whole-system overview. Activity 2, swimlane routing, and narrative cross-references need the same policy wording. |
| SEQ-02 generic view/submit/change messages | Read-only and writing actions are grouped around a save and a Faculty notification | Separate read-only browsing, valid final submission, and later reviewer decisions. Notify only the persisted recipient for approval-required requests. |

Adding search, filters, responsive cards, and quantity controls does not change the later approval order. These are draft interactions before final submission. Catalogue selection must carry item identity and quantity into review and final validation.

## Aligned steps and recipients

| Request | Steps | Academic reviewer |
| --- | --- | --- |
| Classrep On-Schedule | Laboratory → Group / Student Only and students → Schedule Type → Schedule & Room → Equipment & Materials → Review | Selected subject's assigned Faculty |
| Classrep Out-of-Schedule | Same six steps | Assigned Faculty or Dean, explicitly chosen in Review |
| Faculty Laboratory Activity | Laboratory → Activity Type → assigned Schedule & Room → Equipment & Materials → Review | None |
| Faculty Non-Laboratory Activity, On-Schedule | Laboratory → Activity Type → Schedule Type → assigned Schedule & Room → Equipment & Materials → Review | None |
| Faculty Non-Laboratory Activity, Out-of-Schedule | Same six steps as Faculty Non-Laboratory Activity above, using an available block | Dean only |

Group / Student Only applies to both Classrep schedule variants. Student Only contains exactly one class student. Faculty has no participant-type choice. The equipment step remains after the room step, matching the implemented form order.

## Current demo sequence

This describes the running prototype. There is no request database write, inventory hold, approval delivery, or room reservation. Login uses the separate demo session service.

```mermaid
sequenceDiagram
    actor U as Classrep or Faculty
    participant UI as Request Form
    participant M as Local Validation
    U->>UI: Choose laboratory and role-specific request details
    U->>UI: Select assigned or available schedule and room
    U->>UI: Search catalogue and choose items/quantities
    UI->>M: Check sample stock and item details
    M-->>UI: Draft validation result
    U->>UI: Open Review Information
    alt Classrep On-Schedule
        UI-->>U: Show assigned Faculty
    else Classrep Out-of-Schedule
        UI-->>U: Offer assigned Faculty or Dean
        U->>UI: Select one approval recipient
    else Faculty On-Schedule
        UI-->>U: No academic approval; reservation processing
    else Faculty Non-Laboratory Activity Out-of-Schedule
        UI-->>U: Show Dean as recipient
    end
    U->>UI: Confirm details and Submit Demo Request
    UI->>M: Revalidate complete draft and route
    alt Invalid draft
        M-->>UI: Validation error
        UI-->>U: Correct details before submitting
    else Valid draft
        M-->>UI: Detached local snapshot
        UI-->>U: Locked demo reference and review
    end
    Note over UI,M: Leaving or reloading clears the request preview
```

## Proposed backend sequence for SEQ-02

This is the integration design, not an implemented request API. Both preparation and submission must use the signed-in user's authorized classes/laboratory. An available-looking UI block or stock badge cannot authorize a conflicting request.

```mermaid
sequenceDiagram
    actor U as Requester
    participant UI as Request Form
    participant S as Laboratory System
    participant DB as Request / Schedule / Inventory Records
    actor R as One Routed Faculty or Dean
    U->>UI: Open request form
    UI->>S: Read scoped classes, room schedule and catalogue
    S->>DB: Read authorized assignments, blocks, holds and stock
    DB-->>S: Current evidence
    S-->>UI: Scoped choices and availability
    U->>UI: Prepare schedule/items and review details
    Note over UI,DB: Browsing and editing the draft do not save a request or hold
    U->>UI: Confirm and submit
    UI->>S: Submit details, item IDs/quantities and applicable recipient choice
    S->>DB: Recheck scope, students, room/time conflicts and stock
    DB-->>S: Current validation evidence
    S->>S: Validate activity/schedule combination and resolve one route
    alt Validation fails
        S-->>UI: Errors; no request or hold created
        UI-->>U: Retain draft for correction
    else Valid request
        alt Faculty On-Schedule, either permitted activity type
            S->>DB: Save eligible request/revision/items and applicable hold; no approval row
            DB-->>S: Saved reservation state
            S-->>UI: Reservation-processing result
        else Classrep On-Schedule / Out-of-Schedule or Faculty Out-of-Schedule
            S->>DB: Save Pending request, current revision/items, hold and one approval recipient
            DB-->>S: Saved request and current reviewer
            S-->>UI: Pending and current reviewer
            S-->>R: Notify persisted reviewer only
            Note over S,R: Review occurs later; Pending waits for a human decision
            R->>S: Approve or reject routed current revision
            S->>DB: Verify reviewer scope and current pending revision
            DB-->>S: Eligibility and latest state
            alt Reviewer authorized and revision current
                alt Approve
                    S->>DB: Save final Approved; retain applicable hold
                else Reject
                    S->>DB: Save Rejected; release applicable hold
                end
                DB-->>S: Decision saved
                S-->>R: Decision confirmation
                S-->>U: Own request decision/status
            else Unauthorized reviewer or stale revision
                S-->>R: Reject action; retain current request state
            end
        end
    end
```

The one reviewer is assigned Faculty for Classrep On-Schedule, the validated Faculty/Dean selection for Classrep Out-of-Schedule, and Dean for Faculty Non-Laboratory Activity Out-of-Schedule. Approval is final for that route: there is no subsequent Faculty-to-Dean approval stage.

Faculty's demo label `Awaiting Reservation` describes processing without academic approval. The documentation's `Approved` represents academic eligibility. Define the persisted reservation-state mapping during integration; do not treat either label as proof that equipment was issued. Issuance and stock deduction remain later staff operations in SEQ-04.

## Data and publication follow-up

- The documented `APPROVAL.approver_id` and unique `revision_id` can express one routed reviewer. The selected UI role must be resolved to an authorized account, not trusted as a free client value.
- Map Faculty Activity Type and schedule basis to the documented `REQUEST_REVISION.usage_type` and `request_basis`; verify the enum definitions before implementation.
- Catalogue selections must resolve to `REQUEST_ITEM.item_id`. The prototype's free-text Additional Items cannot be inserted directly into that non-null item foreign key; define staff fulfilment or an explicit supplemental-needs representation first.
- Stock badges are sample values. Backend stock validation and applicable holds must be rechecked at submission and later issuance. Existing regular class blocks must not be duplicated into competing reservations.
- Regenerate SEQ-02, the whole-sequence overview and their PDFs after updating model sources, the plan, and traceability text together. Unrelated login, clearance, return and reporting sequences do not need UI-step changes from this update.

Implementation references: `src/features/lab-dashboard/request-review.ts`, `faculty-request-model.ts`, `laboratory-service-request.tsx`, `faculty-service-request.tsx`, and `equipment-catalog.ts`.
