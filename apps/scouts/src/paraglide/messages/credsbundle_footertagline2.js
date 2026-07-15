/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Footertagline2Inputs */

const en_credsbundle_footertagline2 = /** @type {((inputs: Credsbundle_Footertagline2Inputs) => LocalizedString) & { parts: (inputs: Credsbundle_Footertagline2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Credsbundle_Footertagline2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`POWERED BY CONSENT FLOW • You own your own data • All connections are encrypted`)
		}),
		{
			parts: /** @type {(inputs: Credsbundle_Footertagline2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "POWERED BY CONSENT FLOW • You own your own data • All connections are " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "encrypted" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_credsbundle_footertagline2 = /** @type {((inputs: Credsbundle_Footertagline2Inputs) => LocalizedString) & { parts: (inputs: Credsbundle_Footertagline2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Credsbundle_Footertagline2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`IMPULSADO POR CONSENT FLOW • Tú controlas tus datos • Todas las conexiones están cifradas`)
		}),
		{
			parts: /** @type {(inputs: Credsbundle_Footertagline2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "IMPULSADO POR CONSENT FLOW • Tú controlas tus datos • Todas las conexiones están " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "cifradas" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_credsbundle_footertagline2 = /** @type {((inputs: Credsbundle_Footertagline2Inputs) => LocalizedString) & { parts: (inputs: Credsbundle_Footertagline2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Credsbundle_Footertagline2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`PROPULSÉ PAR CONSENT FLOW • Vous possédez vos données • Toutes les connexions sont chiffrées`)
		}),
		{
			parts: /** @type {(inputs: Credsbundle_Footertagline2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "PROPULSÉ PAR CONSENT FLOW • Vous possédez vos données • Toutes les connexions sont " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "chiffrées" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_credsbundle_footertagline2 = /** @type {((inputs: Credsbundle_Footertagline2Inputs) => LocalizedString) & { parts: (inputs: Credsbundle_Footertagline2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Credsbundle_Footertagline2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`مدعوم من CONSENT FLOW • أنت تملك بياناتك • جميع الاتصالات مشفرة`)
		}),
		{
			parts: /** @type {(inputs: Credsbundle_Footertagline2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "مدعوم من CONSENT FLOW • أنت تملك بياناتك • جميع الاتصالات " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "مشفرة" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "POWERED BY CONSENT FLOW • You own your own data • All connections are encrypted" |
*
* @param {Credsbundle_Footertagline2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_footertagline2 = /** @type {((inputs?: Credsbundle_Footertagline2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Credsbundle_Footertagline2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Credsbundle_Footertagline2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Credsbundle_Footertagline2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_credsbundle_footertagline2(inputs)
			if (locale === "es") return es_credsbundle_footertagline2(inputs)
			if (locale === "fr") return fr_credsbundle_footertagline2(inputs)
			return ar_credsbundle_footertagline2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Credsbundle_Footertagline2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_credsbundle_footertagline2.parts === "function" ? en_credsbundle_footertagline2.parts(inputs) : [{ type: "text", value: en_credsbundle_footertagline2(inputs) }]
				if (locale === "es") return typeof es_credsbundle_footertagline2.parts === "function" ? es_credsbundle_footertagline2.parts(inputs) : [{ type: "text", value: es_credsbundle_footertagline2(inputs) }]
				if (locale === "fr") return typeof fr_credsbundle_footertagline2.parts === "function" ? fr_credsbundle_footertagline2.parts(inputs) : [{ type: "text", value: fr_credsbundle_footertagline2(inputs) }]
				return typeof ar_credsbundle_footertagline2.parts === "function" ? ar_credsbundle_footertagline2.parts(inputs) : [{ type: "text", value: ar_credsbundle_footertagline2(inputs) }]
			})
		}
	)
);
export { credsbundle_footertagline2 as "credsBundle.footerTagline" }