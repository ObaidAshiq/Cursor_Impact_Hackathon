import type { ImpactEvent } from "@/lib/domain";

export const seedEvents: ImpactEvent[] = [
  // {
  //   slug: "strait-hormuz-shipping-disruption",
  //   title: "Major shipping lane disruption and crude market pressure",
  //   category: "energy_fuel",
  //   severity: 4,
  //   horizon: "weeks",
  //   updatedAt: "2026-03-28T00:00:00.000Z",
  //   whatWeKnow: [
  //     "Reports describe elevated risk or restrictions affecting a key crude export corridor; details vary by outlet and date.",
  //     "India imports a large share of crude oil; import costs and retail fuel economics are sensitive to global crude and freight conditions.",
  //   ],
  //   whatWeInfer: [
  //     "If sustained, higher crude or insurance-driven freight costs can contribute to upward pressure on pump prices and logistics.",
  //     "Urban commuters and goods movement may feel effects through transport and delivery surcharges rather than an immediate physical shortage.",
  //   ],
  //   indiaImpact:
  //     "National exposure is tied to import costs, refining margins, and government tax and pricing policy. Effects often show up gradually in transport and goods prices.",
  //   localNotes: {
  //     mumbai:
  //       "High reliance on road freight and dense commuting can make fuel and taxi or delivery costs more visible early.",
  //     delhi:
  //       "NCR logistics and winter-related demand patterns can amplify visibility of diesel and transport cost changes.",
  //   },
  //   mostAffectedPersonas: ["commuter", "small_business_owner", "importer"],
  //   factsConfidence: "medium",
  //   inferConfidence: "medium",
  //   citations: [
  //     {
  //       id: "eia-petroleum",
  //       title: "U.S. EIA — Petroleum and other liquids data",
  //       url: "https://www.eia.gov/petroleum/",
  //       publisher: "U.S. Energy Information Administration",
  //       retrievedAt: "2026-03-28T00:00:00.000Z",
  //       kind: "data",
  //     },
  //     {
  //       id: "ppac-home",
  //       title: "PPAC — Petroleum Planning & Analysis Cell (India)",
  //       url: "https://ppac.gov.in/",
  //       publisher: "Government of India",
  //       retrievedAt: "2026-03-28T00:00:00.000Z",
  //       kind: "official",
  //     },
  //   ],
  //   actionsByPersona: {
  //     commuter: [
  //       "Avoid panic buying; refill when you normally would unless an official advisory says otherwise.",
  //       "Budget for possible fuel volatility over the next few weeks.",
  //       "Check official retail bulletins and trusted news for confirmed supply issues in your city.",
  //     ],
  //     small_business_owner: [
  //       "Review freight and fuel surcharges on contracts; communicate timelines with customers if costs move.",
  //       "Keep a short buffer inventory if deliveries are critical, without hoarding.",
  //     ],
  //     importer: [
  //       "Reconfirm shipping schedules and insurance clauses for affected lanes.",
  //       "Monitor official customs and ministry notices for any trade measures.",
  //     ],
  //   },
  // },
  // {
  //   slug: "wheat-export-policy-shift",
  //   title: "Policy or trade change affecting staple grain flows",
  //   category: "food_supply_chain",
  //   severity: 3,
  //   horizon: "months",
  //   updatedAt: "2026-03-28T00:00:00.000Z",
  //   whatWeKnow: [
  //     "Export or stockholding rules for staples can change with short notice during price or weather stress.",
  //     "PIB and ministry releases are the primary place to confirm official measures.",
  //   ],
  //   whatWeInfer: [
  //     "Export restrictions can lower domestic availability pressure but may raise global benchmarks for substitutes.",
  //     "Retail atta and bakery channels may adjust more slowly than wholesale mandi prices.",
  //   ],
  //   indiaImpact:
  //     "Household staples and food service input costs can shift. Rural producers and urban consumers are affected through different channels.",
  //   localNotes: {
  //     delhi:
  //       "Wholesale mandis and large retail chains often reflect policy changes within days; watch local mandi bulletins.",
  //   },
  //   mostAffectedPersonas: ["farmer", "student", "small_business_owner"],
  //   factsConfidence: "low",
  //   inferConfidence: "medium",
  //   citations: [
  //     {
  //       id: "pib",
  //       title: "Press Information Bureau — official releases",
  //       url: "https://pib.gov.in/",
  //       publisher: "Government of India",
  //       retrievedAt: "2026-03-28T00:00:00.000Z",
  //       kind: "official",
  //     },
  //     {
  //       id: "data-gov-in",
  //       title: "Open Government Data Platform India",
  //       url: "https://www.data.gov.in/",
  //       publisher: "Government of India",
  //       retrievedAt: "2026-03-28T00:00:00.000Z",
  //       kind: "official",
  //     },
  //   ],
  //   actionsByPersona: {
  //     farmer: [
  //       "Verify MSP and procurement announcements only from official ministry or PIB sources.",
  //       "If selling in mandis, watch state agricultural marketing department notices.",
  //     ],
  //     student: [
  //       "Staple price moves are usually gradual; plan a modest buffer for mess or grocery costs if you are on a tight budget.",
  //     ],
  //     small_business_owner: [
  //       "If you run a bakery or eatery, re-quote menus only after confirming wholesale input price changes.",
  //     ],
  //   },
  // },
  // {
  //   slug: "rbi-policy-rate-update",
  //   title: "Reserve Bank of India monetary policy communication",
  //   category: "economic_policy",
  //   severity: 3,
  //   horizon: "months",
  //   updatedAt: "2026-03-28T00:00:00.000Z",
  //   whatWeKnow: [
  //     "The RBI publishes monetary policy decisions and statements on its official site.",
  //     "Policy rates influence lending and deposit rates indirectly through banks.",
  //   ],
  //   whatWeInfer: [
  //     "If rates rise, new floating home loans and some business credit may become more expensive over subsequent months.",
  //     "Fixed-rate products are less immediately affected than new floating offers.",
  //   ],
  //   indiaImpact:
  //     "Credit-sensitive sectors and households with floating loans feel adjustments over time; exact pass-through varies by bank.",
  //   localNotes: {
  //     mumbai:
  //       "Metro housing markets and unsecured credit demand can be early sentiment indicators, not hard rules for your loan.",
  //   },
  //   mostAffectedPersonas: ["student", "small_business_owner", "commuter"],
  //   factsConfidence: "high",
  //   inferConfidence: "medium",
  //   citations: [
  //     {
  //       id: "rbi",
  //       title: "Reserve Bank of India — official site",
  //       url: "https://www.rbi.org.in/",
  //       publisher: "Reserve Bank of India",
  //       retrievedAt: "2026-03-28T00:00:00.000Z",
  //       kind: "official",
  //     },
  //   ],
  //   actionsByPersona: {
  //     commuter: [
  //       "If you plan a large purchase on EMI, compare APR offers after major policy announcements.",
  //     ],
  //     student: [
  //       "Education loan offers are bank-specific; use RBI statements as context, not as personal financial advice.",
  //     ],
  //     small_business_owner: [
  //       "Review working capital lines after policy changes; talk to your bank for firm-specific terms.",
  //     ],
  //   },
  // },
];
