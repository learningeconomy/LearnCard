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

const de_sidemenu_footer_poweredby1 = /** @type {((inputs: Sidemenu_Footer_Poweredby1Inputs) => LocalizedString) & { parts: (inputs: Sidemenu_Footer_Poweredby1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Sidemenu_Footer_Poweredby1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Bereitgestellt von Consent Flow`)
		}),
		{
			parts: /** @type {(inputs: Sidemenu_Footer_Poweredby1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Bereitgestellt von " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Consent Flow" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_sidemenu_footer_poweredby1 = /** @type {((inputs: Sidemenu_Footer_Poweredby1Inputs) => LocalizedString) & { parts: (inputs: Sidemenu_Footer_Poweredby1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Sidemenu_Footer_Poweredby1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`مُشغَّل بواسطة Consent Flow`)
		}),
		{
			parts: /** @type {(inputs: Sidemenu_Footer_Poweredby1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "مُشغَّل بواسطة " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Consent Flow" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
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
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_footer_poweredby1 = /** @type {((inputs?: Sidemenu_Footer_Poweredby1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & { parts: (inputs?: Sidemenu_Footer_Poweredby1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Sidemenu_Footer_Poweredby1Inputs, { locale?: "en" | "es" | "de" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Sidemenu_Footer_Poweredby1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_sidemenu_footer_poweredby1(inputs)
			if (locale === "es") return es_sidemenu_footer_poweredby1(inputs)
			if (locale === "de") return de_sidemenu_footer_poweredby1(inputs)
			return ar_sidemenu_footer_poweredby1(inputs)
		}),
		{
			parts: /** @type {(inputs?: Sidemenu_Footer_Poweredby1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_sidemenu_footer_poweredby1.parts === "function" ? en_sidemenu_footer_poweredby1.parts(inputs) : [{ type: "text", value: en_sidemenu_footer_poweredby1(inputs) }]
				if (locale === "es") return typeof es_sidemenu_footer_poweredby1.parts === "function" ? es_sidemenu_footer_poweredby1.parts(inputs) : [{ type: "text", value: es_sidemenu_footer_poweredby1(inputs) }]
				if (locale === "de") return typeof de_sidemenu_footer_poweredby1.parts === "function" ? de_sidemenu_footer_poweredby1.parts(inputs) : [{ type: "text", value: de_sidemenu_footer_poweredby1(inputs) }]
				return typeof ar_sidemenu_footer_poweredby1.parts === "function" ? ar_sidemenu_footer_poweredby1.parts(inputs) : [{ type: "text", value: ar_sidemenu_footer_poweredby1(inputs) }]
			})
		}
	)
);
export { sidemenu_footer_poweredby1 as "sidemenu.footer.poweredBy" }