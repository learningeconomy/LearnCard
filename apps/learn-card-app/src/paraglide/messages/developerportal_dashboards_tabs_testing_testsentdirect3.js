/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ userId: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs */

const en_developerportal_dashboards_tabs_testing_testsentdirect3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`The credential has been sent directly to ${i?.userId}'s wallet.`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "The credential has been sent directly to " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.userId) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "'s wallet." }])
			})
		}
	)
);

const es_developerportal_dashboards_tabs_testing_testsentdirect3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`La credencial se ha enviado directamente a la billetera de ${i?.userId}.`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "La credencial se ha enviado directamente a la billetera de " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.userId) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const fr_developerportal_dashboards_tabs_testing_testsentdirect3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Le credential a été envoyé directement au portefeuille de ${i?.userId}.`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Le credential a été envoyé directement au portefeuille de " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.userId) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const ar_developerportal_dashboards_tabs_testing_testsentdirect3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => LocalizedString) & { parts: (inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`تم إرسال بيانات الاعتماد مباشرة إلى محفظة ${i?.userId}.`)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "تم إرسال بيانات الاعتماد مباشرة إلى محفظة " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.userId) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "The credential has been sent directly to {userId}'s wallet." |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_testsentdirect3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_developerportal_dashboards_tabs_testing_testsentdirect3(inputs)
			if (locale === "es") return es_developerportal_dashboards_tabs_testing_testsentdirect3(inputs)
			if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_testsentdirect3(inputs)
			return ar_developerportal_dashboards_tabs_testing_testsentdirect3(inputs)
		}),
		{
			parts: /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Testsentdirect3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_developerportal_dashboards_tabs_testing_testsentdirect3.parts === "function" ? en_developerportal_dashboards_tabs_testing_testsentdirect3.parts(inputs) : [{ type: "text", value: en_developerportal_dashboards_tabs_testing_testsentdirect3(inputs) }]
				if (locale === "es") return typeof es_developerportal_dashboards_tabs_testing_testsentdirect3.parts === "function" ? es_developerportal_dashboards_tabs_testing_testsentdirect3.parts(inputs) : [{ type: "text", value: es_developerportal_dashboards_tabs_testing_testsentdirect3(inputs) }]
				if (locale === "fr") return typeof fr_developerportal_dashboards_tabs_testing_testsentdirect3.parts === "function" ? fr_developerportal_dashboards_tabs_testing_testsentdirect3.parts(inputs) : [{ type: "text", value: fr_developerportal_dashboards_tabs_testing_testsentdirect3(inputs) }]
				return typeof ar_developerportal_dashboards_tabs_testing_testsentdirect3.parts === "function" ? ar_developerportal_dashboards_tabs_testing_testsentdirect3.parts(inputs) : [{ type: "text", value: ar_developerportal_dashboards_tabs_testing_testsentdirect3(inputs) }]
			})
		}
	)
);
export { developerportal_dashboards_tabs_testing_testsentdirect3 as "developerPortal.dashboards.tabs.testing.testSentDirect" }