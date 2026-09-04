import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { useSiteSettings } from '@/features/site/use-site-settings'
import { useSeo } from '@/lib/use-seo'
import { PageHero, SiteLayout } from './site-layout'

/**
 * The privacy policy and terms.
 *
 * Google Play will not review an app without a publicly reachable privacy
 * policy URL, and the Itoby app puts everything behind sign-in, so this page is
 * a release blocker for the mobile app as much as it is a legal one.
 *
 * Written against what the code actually does rather than from a template: the
 * fields listed under "What we collect" are the columns `submit_lead` writes and
 * the tables the rental module reads, and the processors named are the two the
 * app really talks to. If a table or a third party is added, this page has to
 * change with it — a policy that describes a system you no longer run is worse
 * than none, because it is a statement you have made to your users.
 *
 * Contact details come from `site_settings` so they stay in step with the rest
 * of the site; only the effective date and the legal text itself live here.
 */

/** Last substantive revision. Update when the text below changes, not on deploy. */
const EFFECTIVE = '3 September 2026'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-14 first:mt-0">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[color:var(--fg-2)]">
        {children}
      </div>
    </section>
  )
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            aria-hidden="true"
            className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[color:var(--lime)]"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/** The page body, shared by both legal pages so they read as one document. */
function Prose({ children }: { children: ReactNode }) {
  return (
    <section>
      <div className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-24">{children}</div>
    </section>
  )
}

export function PrivacyPage() {
  useSeo({
    title: 'Privacy policy — Itoby Infotech',
    description:
      'What Itoby Infotech collects through its website and mobile app, why, who it is shared with, and how to have it removed.',
    path: '/privacy',
  })

  const settings = useSiteSettings()
  const s = settings.data
  const company = s?.company_name || 'Itoby Infotech Pvt Ltd'
  const email = s?.email || 'info@itobyinfotech.com'

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Legal"
        title={
          <>
            Privacy policy
          </>
        }
        lead={`How ${company} handles personal information on this website and in the Itoby mobile app. Effective ${EFFECTIVE}.`}
      />

      <Prose>
        <Section title="Who this covers">
          <p>
            This policy applies to this website and to the Itoby mobile app, which are operated by{' '}
            {company}
            {s?.address ? `, ${s.address}` : ''}. Both share one account system and one database, so
            what is said here is true of either.
          </p>
          <p>
            The Itoby app is a suite of business tools. Most of it is used by people whose
            organisation already works with us — property owners billed through IIPL Renting, and our
            own staff. A smaller part, the public pages, is open to anyone.
          </p>
        </Section>

        <Section title="What we collect">
          <p>
            <strong className="text-[color:var(--fg)]">If you send us an enquiry.</strong> The contact
            and quote forms ask for your name and email address, and optionally your phone number,
            company, the service you are interested in, a budget range, and your message. Name and
            email are the only required fields.
          </p>
          <p>
            <strong className="text-[color:var(--fg)]">If you have an account.</strong> Your email
            address, the role your organisation has been given, and the name and contact details
            recorded against your account.
          </p>
          <p>
            <strong className="text-[color:var(--fg)]">If you are billed through IIPL Renting.</strong>{' '}
            Your lease and the unit it covers, the invoices raised against it, payments made and their
            gateway reference, receipts issued, maintenance complaints you raise together with any
            photographs or files attached to them, and documents shared with you or uploaded by you.
          </p>
          <p>
            <strong className="text-[color:var(--fg)]">Automatically.</strong> A session token stored
            on your device so you stay signed in, and your appearance preference. Actions taken inside
            the product — who changed what, and when — are written to an audit log, which is how a
            billing or complaint record can be explained later.
          </p>
          <p>
            We do not run advertising, we do not use tracking or analytics cookies, and we do not sell
            personal information or share it with data brokers.
          </p>
        </Section>

        <Section title="Why we hold it">
          <Bullets
            items={[
              'To answer an enquiry you sent us, and to follow it up.',
              'To sign you in and show you only what your account is entitled to see.',
              'To raise invoices, take payment, issue receipts and keep the rental records your lease requires.',
              'To handle a maintenance complaint and show you its progress.',
              'To keep records we are required to keep — tax invoices and payment records in particular.',
              'To keep the service secure, and to investigate a problem when something goes wrong.',
            ]}
          />
          <p>
            Where you are in India, the lawful bases are your consent for enquiries, performance of
            the contract for everything tied to a lease, and our legal obligations for financial
            records. Where the GDPR applies, those correspond to consent, contract and legal
            obligation, with a legitimate interest in keeping the service secure.
          </p>
        </Section>

        <Section title="Who else sees it">
          <p>
            We use two processors. Neither is given your data for their own purposes, and we do not
            add others without changing this page first.
          </p>
          <Bullets
            items={[
              <>
                <strong className="text-[color:var(--fg)]">Supabase</strong> hosts the database,
                authentication and file storage behind the website and the app. Data is held in their
                managed infrastructure.
              </>,
              <>
                <strong className="text-[color:var(--fg)]">Razorpay</strong> processes card, UPI and
                netbanking payments. Payment details are entered on Razorpay's own checkout and are
                never handled by us. We receive and store only the outcome and its reference, so an
                invoice can be marked paid and a receipt issued.
              </>,
            ]}
          />
          <p>
            We will also disclose information where the law requires it, or to establish or defend a
            legal claim.
          </p>
        </Section>

        <Section title="Where it is held">
          <p>
            Our infrastructure is operated by providers who may store and process data outside India,
            including in the European Union and the United States. Where personal data leaves the
            country it was collected in, it is protected by the contractual terms we hold with those
            providers.
          </p>
        </Section>

        <Section title="How long we keep it">
          <Bullets
            items={[
              'Enquiries: up to two years from your last contact with us, unless you ask for removal sooner.',
              'Account and rental records: for as long as your lease or relationship with us is active.',
              'Invoices, payments and receipts: eight years after the financial year they belong to, as Indian tax law requires. These cannot be deleted on request while that period runs.',
              'Audit log entries: for as long as the records they explain are held.',
            ]}
          />
        </Section>

        <Section title="Your rights">
          <p>
            You can ask us to show you what we hold about you, correct it, delete it, or give you a
            copy in a portable form. You can withdraw consent for anything you gave it for, and you
            can ask us to stop contacting you at any time.
          </p>
          <p>
            Write to <a href={`mailto:${email}`}>{email}</a> and we will respond within thirty days.
            We may ask you to confirm your identity first, so that we are not handing your records to
            someone else. Where a record must be kept for tax or legal reasons we will tell you which
            one and why, rather than refusing without explanation.
          </p>
          <p>
            Under India's Digital Personal Data Protection Act, {company} is the Data Fiduciary for
            this information and the address above is where a grievance should be sent. If we do not
            resolve it, you may escalate to the Data Protection Board of India.
          </p>
        </Section>

        <Section title="Children">
          <p>
            The Itoby app is a business tool. It is not directed at children, it is not designed for
            them, and we do not knowingly collect information from anyone under 18. If you believe a
            child has given us information, write to us and we will remove it.
          </p>
        </Section>

        <Section title="Deleting your account">
          <p>
            Accounts are created by an administrator at your organisation rather than by self
            sign-up, so they are closed the same way. Ask your administrator, or write to{' '}
            <a href={`mailto:${email}`}>{email}</a> and we will action it. Closing an account removes
            your access and your profile; financial records that we are required to retain are kept
            for the period described above and then deleted.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If this policy changes we will update the effective date at the top and, where the change
            is significant, tell account holders directly. Continuing to use the service after a
            change means you accept the updated policy.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            {company}
            {s?.address ? <>, {s.address}</> : null}
            <br />
            <a href={`mailto:${email}`}>{email}</a>
            {s?.phone ? (
              <>
                <br />
                <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a>
              </>
            ) : null}
          </p>
          <p>
            See also our <Link to="/terms">terms of use</Link>.
          </p>
        </Section>
      </Prose>
    </SiteLayout>
  )
}

export function TermsPage() {
  useSeo({
    title: 'Terms of use — Itoby Infotech',
    description:
      'The terms that apply to the Itoby website, the Itoby mobile app and the products inside it.',
    path: '/terms',
  })

  const settings = useSiteSettings()
  const s = settings.data
  const company = s?.company_name || 'Itoby Infotech Pvt Ltd'
  const email = s?.email || 'info@itobyinfotech.com'

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Legal"
        title={<>Terms of use</>}
        lead={`The terms on which ${company} provides this website and the Itoby app. Effective ${EFFECTIVE}.`}
      />

      <Prose>
        <Section title="Accounts">
          <p>
            Accounts are issued by {company} or by an administrator at your organisation. You are
            responsible for what happens under yours, so keep your credentials to yourself and tell us
            promptly if you think someone else has them.
          </p>
          <p>
            What you can see and do is decided by the role your account holds. Attempting to reach
            data your role does not cover is a misuse of the service.
          </p>
        </Section>

        <Section title="Payments">
          <p>
            Invoices raised in IIPL Renting are payable by their due date. Payment is taken through
            Razorpay, and a payment is treated as complete only once Razorpay confirms it to us —
            closing the checkout window is not, on its own, either a payment or a failure.
          </p>
          <p>
            A receipt is issued automatically once a payment is confirmed. If an amount looks wrong,
            raise it with us before paying; refunds of a confirmed payment are handled case by case
            and by agreement with the party that billed you.
          </p>
        </Section>

        <Section title="Acceptable use">
          <Bullets
            items={[
              'Do not upload anything unlawful, or anything you do not have the right to share.',
              'Do not attempt to gain access to accounts, data or systems that are not yours.',
              'Do not probe, scan or load-test the service without our written permission.',
              'Do not use the service to send bulk unsolicited messages.',
            ]}
          />
          <p>
            We may suspend an account that is being used this way, and will tell the account holder
            why.
          </p>
        </Section>

        <Section title="Availability">
          <p>
            We work to keep the service available and we take backups, but we do not promise
            uninterrupted service. Maintenance, provider outages and faults happen. Where we know
            about planned downtime in advance we will give notice.
          </p>
        </Section>

        <Section title="Content and ownership">
          <p>
            The software, its design and its content belong to {company}. Files and records you upload
            or that are recorded about your tenancy remain yours; you grant us only the permission
            needed to store them, show them to you, and operate the service.
          </p>
        </Section>

        <Section title="Liability">
          <p>
            Nothing here limits liability that cannot be limited by law. Beyond that, our liability
            for any claim arising from the service is limited to the amounts you paid us for it in the
            twelve months before the claim, and we are not liable for indirect or consequential loss.
          </p>
        </Section>

        <Section title="Governing law">
          <p>
            These terms are governed by the laws of India, and the courts at Noida, Uttar Pradesh have
            exclusive jurisdiction over any dispute arising from them.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms go to <a href={`mailto:${email}`}>{email}</a>. See also our{' '}
            <Link to="/privacy">privacy policy</Link>.
          </p>
        </Section>
      </Prose>
    </SiteLayout>
  )
}
