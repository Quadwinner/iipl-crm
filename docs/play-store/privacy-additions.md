# Privacy policy — sections to add to the live site

The Play Store listing points at **https://www.itobyinfotech.com/privacy**, which
lives in the old Next.js site and stays there for the next couple of months. That
page was written for a marketing site: 618 words covering enquiry forms, and
nothing about the app.

Google cross-checks the Data Safety declaration against the policy the listing
links to. Four of the things the declaration has to say are not on that page
today, and one of them — account deletion — is a hard requirement for any app
that has accounts, and a common cause of rejection.

Paste the sections below into the existing page. They are written to slot in
beside its current headings rather than replace them. The wording matches
`apps/web/src/routes/site/legal.tsx`, which is the version that takes over when
the superapp moves onto the domain, so the two do not contradict each other.

**Give the account deletion section an `id="account-deletion"` anchor.** Play
Console asks for an account deletion URL separately from the policy URL, and
`https://www.itobyinfotech.com/privacy#account-deletion` is a valid answer only
if that anchor exists.

---

## Add under "Information We Collect"

### If you have an Itoby account

Your email address, the role your organisation has been given, and the name and
contact details recorded against your account.

### If you are billed through IIPL Renting

Your lease and the unit it covers, the invoices raised against it, payments made
and their gateway reference, receipts issued, maintenance complaints you raise
together with any photographs or files attached to them, and documents shared
with you or uploaded by you.

### Automatically

A session token stored on your device so you stay signed in, and your appearance
preference. Actions taken inside the product — who changed what, and when — are
written to an audit log, which is how a billing or complaint record can be
explained later.

We do not run advertising, we do not use tracking or analytics cookies, and we do
not sell personal information or share it with data brokers.

---

## Replace "Third-Party Services" with this

We use two processors. Neither is given your data for their own purposes, and we
do not add others without changing this page first.

- **Supabase** hosts the database, authentication and file storage behind the
  website and the Itoby app. Data is held in their managed infrastructure.
- **Razorpay** processes card, UPI and netbanking payments. Payment details are
  entered on Razorpay's own checkout and are never handled by us. We receive and
  store only the outcome and its reference, so an invoice can be marked paid and
  a receipt issued.

We will also disclose information where the law requires it, or to establish or
defend a legal claim.

Our infrastructure is operated by providers who may store and process data
outside India, including in the European Union and the United States. Where
personal data leaves the country it was collected in, it is protected by the
contractual terms we hold with those providers.

---

## Add a new section: "How Long We Keep It"

- Enquiries: up to two years from your last contact with us, unless you ask for
  removal sooner.
- Account and rental records: for as long as your lease or relationship with us
  is active.
- Invoices, payments and receipts: eight years after the financial year they
  belong to, as Indian tax law requires. These cannot be deleted on request while
  that period runs.
- Audit log entries: for as long as the records they explain are held.

---

## Add a new section: "Deleting Your Account"

**This one is required.** Give the heading `id="account-deletion"`.

Accounts are created by an administrator at your organisation rather than by
self sign-up, so they are closed the same way. Ask your administrator, or write
to info@itobyinfotech.com and we will action it within thirty days.

Closing an account removes your access and your profile. Financial records that
we are required to retain — invoices, payments and receipts — are kept for the
period described above and then deleted.

To request deletion, email info@itobyinfotech.com from the address on the
account, with the subject "Delete my account".

---

## Add a new section: "Children"

The Itoby app is a business tool. It is not directed at children, it is not
designed for them, and we do not knowingly collect information from anyone under
18. If you believe a child has given us information, write to us and we will
remove it.

---

## Add under "Your Rights"

Under India's Digital Personal Data Protection Act, Itoby Infotech Pvt Ltd is the
Data Fiduciary for this information, and Sector-4, Noida, UP, India is where a
grievance should be sent. If we do not resolve it, you may escalate to the Data
Protection Board of India.

Write to info@itobyinfotech.com and we will respond within thirty days. We may
ask you to confirm your identity first, so that we are not handing your records
to someone else. Where a record must be kept for tax or legal reasons we will
tell you which one and why, rather than refusing without explanation.

---

# Filling in the Play Console Data Safety form

The answers below are what the code actually does. They have to agree with the
policy above, so change both together or neither.

## Data collected

| Category | Type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|---|
| Personal info | Name | Yes | No | App functionality, Account management | Required |
| Personal info | Email address | Yes | No | App functionality, Account management | Required |
| Personal info | Phone number | Yes | No | App functionality, Customer support | Optional |
| Personal info | Address | Yes | No | App functionality | Optional |
| Financial info | Purchase history | Yes | No | App functionality | Required |
| Photos and videos | Photos | Yes | No | App functionality | Optional |
| Files and docs | Files and docs | Yes | No | App functionality | Optional |
| App activity | Other actions | Yes | No | App functionality, Fraud prevention | Required |

Notes for the form:

- **Payment info is not collected.** Card, UPI and netbanking details are entered
  on Razorpay's checkout, which runs in a WebView. They never reach our code or
  our database. Declare purchase history — invoice amounts, payment status and
  the gateway reference — not payment method.
- **Photos and files** are the attachments on a maintenance complaint and the
  documents an owner uploads. Both are optional; the app works without them.
- **App activity → other actions** is the audit log.
- **Nothing is shared** in Play's sense. Supabase and Razorpay are processors
  acting on our instructions, and Play's own guidance says transfer to a service
  provider is not "sharing".
- **No location, no contacts, no device identifiers, no advertising ID.**

## Security practices

- Data is encrypted in transit: **yes.** All traffic is HTTPS and the database is
  reached over TLS.
- Users can request data deletion: **yes** — give the account deletion URL.
- Committed to Play Families Policy: **not applicable**, the app is not for
  children.
- Independent security review: **no**.

## App access

Everything except the public pages is behind sign-in, so the review team needs a
working account or the app is rejected as broken. Under **App access → All
functionality requires credentials**, give them:

- A real owner account and its password, so they can reach IIPL Renting.
- An instruction that the rest of the products show a "coming soon" screen by
  design, because four of the five tiles do.

Create a dedicated reviewer account rather than handing over a live one, and
leave it enabled for as long as the app is listed — Google re-uses it on every
update review.

## Ads

The app contains no ads. Answer no.
