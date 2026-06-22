/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ email: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs */

const en_developerportal_dashboards_tabs_testing_testsentemail3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Check your email at ${i?.email} for the claim link.`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Check your email at " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " for the claim link." }])
			})
		}
	)
);

const es_developerportal_dashboards_tabs_testing_testsentemail3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Revisa tu correo en ${i?.email} para el enlace de reclamo.`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Revisa tu correo en " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " para el enlace de reclamo." }])
			})
		}
	)
);

const fr_developerportal_dashboards_tabs_testing_testsentemail3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Vérifiez votre email à ${i?.email} pour le lien de réclamation.`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Vérifiez votre email à " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " pour le lien de réclamation." }])
			})
		}
	)
);

const ar_developerportal_dashboards_tabs_testing_testsentemail3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`تحقق من بريدك الإلكتروني على ${i?.email} للحصول على رابط المطالبة.`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "تحقق من بريدك الإلكتروني على " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " للحصول على رابط المطالبة." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Check your email at {email} for the claim link." |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_testsentemail3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_developerportal_dashboards_tabs_testing_testsentemail3(inputs)
			if (locale === "es") return es_developerportal_dashboards_tabs_testing_testsentemail3(inputs)
			if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_testsentemail3(inputs)
			return ar_developerportal_dashboards_tabs_testing_testsentemail3(inputs)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentemail3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_developerportal_dashboards_tabs_testing_testsentemail3.parts === "function" ? en_developerportal_dashboards_tabs_testing_testsentemail3.parts(inputs) : [{ type: "text", value: en_developerportal_dashboards_tabs_testing_testsentemail3(inputs) }]
				if (locale === "es") return typeof es_developerportal_dashboards_tabs_testing_testsentemail3.parts === "function" ? es_developerportal_dashboards_tabs_testing_testsentemail3.parts(inputs) : [{ type: "text", value: es_developerportal_dashboards_tabs_testing_testsentemail3(inputs) }]
				if (locale === "fr") return typeof fr_developerportal_dashboards_tabs_testing_testsentemail3.parts === "function" ? fr_developerportal_dashboards_tabs_testing_testsentemail3.parts(inputs) : [{ type: "text", value: fr_developerportal_dashboards_tabs_testing_testsentemail3(inputs) }]
				return typeof ar_developerportal_dashboards_tabs_testing_testsentemail3.parts === "function" ? ar_developerportal_dashboards_tabs_testing_testsentemail3.parts(inputs) : [{ type: "text", value: ar_developerportal_dashboards_tabs_testing_testsentemail3(inputs) }]
			})
		}
	)
);
export { developerportal_dashboards_tabs_testing_testsentemail3 as "developerPortal.dashboards.tabs.testing.testSentEmail" }