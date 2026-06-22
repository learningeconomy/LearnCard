/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Footer_Poweredby1Inputs */

const en_sidemenu_footer_poweredby1 = /** @type {((inputs: Sidemenu_Footer_Poweredby1Inputs) => LocalizedString) & { parts: (inputs: Sidemenu_Footer_Poweredby1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Sidemenu_Footer_Poweredby1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Powered by Consent Flow`)
		}),
		{
			parts: /** @type {(inputs: Sidemenu_Footer_Poweredby1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Powered by " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Consent Flow" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_sidemenu_footer_poweredby1 = /** @type {((inputs: Sidemenu_Footer_Poweredby1Inputs) => LocalizedString) & { parts: (inputs: Sidemenu_Footer_Poweredby1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Sidemenu_Footer_Poweredby1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Desarrollado por Consent Flow`)
		}),
		{
			parts: /** @type {(inputs: Sidemenu_Footer_Poweredby1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Desarrollado por " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Consent Flow" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_sidemenu_footer_poweredby1 = /** @type {((inputs: Sidemenu_Footer_Poweredby1Inputs) => LocalizedString) & { parts: (inputs: Sidemenu_Footer_Poweredby1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Sidemenu_Footer_Poweredby1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Propulsé par Consent Flow`)
		}),
		{
			parts: /** @type {(inputs: Sidemenu_Footer_Poweredby1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Propulsé par " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Consent Flow" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_sidemenu_footer_poweredby1 = /** @type {((inputs: Sidemenu_Footer_Poweredby1Inputs) => LocalizedString) & { parts: (inputs: Sidemenu_Footer_Poweredby1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Sidemenu_Footer_Poweredby1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`مدعوم من Consent Flow`)
		}),
		{
			parts: /** @type {(inputs: Sidemenu_Footer_Poweredby1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "مدعوم من " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Consent Flow" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Powered by Consent Flow" |
*
* @param {Sidemenu_Footer_Poweredby1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_footer_poweredby1 = /** @type {((inputs?: Sidemenu_Footer_Poweredby1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Sidemenu_Footer_Poweredby1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Sidemenu_Footer_Poweredby1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Sidemenu_Footer_Poweredby1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_sidemenu_footer_poweredby1(inputs)
			if (locale === "es") return es_sidemenu_footer_poweredby1(inputs)
			if (locale === "fr") return fr_sidemenu_footer_poweredby1(inputs)
			return ar_sidemenu_footer_poweredby1(inputs)
		}),
		{
			parts: /** @type {(inputs?: Sidemenu_Footer_Poweredby1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_sidemenu_footer_poweredby1.parts === "function" ? en_sidemenu_footer_poweredby1.parts(inputs) : [{ type: "text", value: en_sidemenu_footer_poweredby1(inputs) }]
				if (locale === "es") return typeof es_sidemenu_footer_poweredby1.parts === "function" ? es_sidemenu_footer_poweredby1.parts(inputs) : [{ type: "text", value: es_sidemenu_footer_poweredby1(inputs) }]
				if (locale === "fr") return typeof fr_sidemenu_footer_poweredby1.parts === "function" ? fr_sidemenu_footer_poweredby1.parts(inputs) : [{ type: "text", value: fr_sidemenu_footer_poweredby1(inputs) }]
				return typeof ar_sidemenu_footer_poweredby1.parts === "function" ? ar_sidemenu_footer_poweredby1.parts(inputs) : [{ type: "text", value: ar_sidemenu_footer_poweredby1(inputs) }]
			})
		}
	)
);
export { sidemenu_footer_poweredby1 as "sidemenu.footer.poweredBy" }