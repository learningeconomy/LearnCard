/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Footer_Connectionsencrypted1Inputs */

const en_sidemenu_footer_connectionsencrypted1 = /** @type {((inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => LocalizedString) & { parts: (inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`All connections are encrypted.`)
		}),
		{
			parts: /** @type {(inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "All connections are " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "encrypted." }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_sidemenu_footer_connectionsencrypted1 = /** @type {((inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => LocalizedString) & { parts: (inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Todas las conexiones están cifradas.`)
		}),
		{
			parts: /** @type {(inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Todas las conexiones están " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "cifradas." }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const de_sidemenu_footer_connectionsencrypted1 = /** @type {((inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => LocalizedString) & { parts: (inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Alle Verbindungen sind verschlüsselt.`)
		}),
		{
			parts: /** @type {(inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Alle Verbindungen sind " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "verschlüsselt." }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_sidemenu_footer_connectionsencrypted1 = /** @type {((inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => LocalizedString) & { parts: (inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`جميع الاتصالات مشفّرة.`)
		}),
		{
			parts: /** @type {(inputs: Sidemenu_Footer_Connectionsencrypted1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "جميع الاتصالات " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "مشفّرة." }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "All connections are encrypted." |
*
* @param {Sidemenu_Footer_Connectionsencrypted1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_footer_connectionsencrypted1 = /** @type {((inputs?: Sidemenu_Footer_Connectionsencrypted1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & { parts: (inputs?: Sidemenu_Footer_Connectionsencrypted1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Sidemenu_Footer_Connectionsencrypted1Inputs, { locale?: "en" | "es" | "de" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Sidemenu_Footer_Connectionsencrypted1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_sidemenu_footer_connectionsencrypted1(inputs)
			if (locale === "es") return es_sidemenu_footer_connectionsencrypted1(inputs)
			if (locale === "de") return de_sidemenu_footer_connectionsencrypted1(inputs)
			return ar_sidemenu_footer_connectionsencrypted1(inputs)
		}),
		{
			parts: /** @type {(inputs?: Sidemenu_Footer_Connectionsencrypted1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_sidemenu_footer_connectionsencrypted1.parts === "function" ? en_sidemenu_footer_connectionsencrypted1.parts(inputs) : [{ type: "text", value: en_sidemenu_footer_connectionsencrypted1(inputs) }]
				if (locale === "es") return typeof es_sidemenu_footer_connectionsencrypted1.parts === "function" ? es_sidemenu_footer_connectionsencrypted1.parts(inputs) : [{ type: "text", value: es_sidemenu_footer_connectionsencrypted1(inputs) }]
				if (locale === "de") return typeof de_sidemenu_footer_connectionsencrypted1.parts === "function" ? de_sidemenu_footer_connectionsencrypted1.parts(inputs) : [{ type: "text", value: de_sidemenu_footer_connectionsencrypted1(inputs) }]
				return typeof ar_sidemenu_footer_connectionsencrypted1.parts === "function" ? ar_sidemenu_footer_connectionsencrypted1.parts(inputs) : [{ type: "text", value: ar_sidemenu_footer_connectionsencrypted1(inputs) }]
			})
		}
	)
);
export { sidemenu_footer_connectionsencrypted1 as "sidemenu.footer.connectionsEncrypted" }