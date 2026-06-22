/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Footer_Haveseedphrase2Inputs */

const en_login_footer_haveseedphrase2 = /** @type {((inputs: Login_Footer_Haveseedphrase2Inputs) => LocalizedString) & { parts: (inputs: Login_Footer_Haveseedphrase2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Footer_Haveseedphrase2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Have your own seed phrase?`)
		}),
		{
			parts: /** @type {(inputs: Login_Footer_Haveseedphrase2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Have your own " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "seed phrase" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "?" }])
			})
		}
	)
);

const es_login_footer_haveseedphrase2 = /** @type {((inputs: Login_Footer_Haveseedphrase2Inputs) => LocalizedString) & { parts: (inputs: Login_Footer_Haveseedphrase2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Footer_Haveseedphrase2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`¿Tienes tu propia frase semilla?`)
		}),
		{
			parts: /** @type {(inputs: Login_Footer_Haveseedphrase2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "¿Tienes tu propia " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "frase semilla" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "?" }])
			})
		}
	)
);

const fr_login_footer_haveseedphrase2 = /** @type {((inputs: Login_Footer_Haveseedphrase2Inputs) => LocalizedString) & { parts: (inputs: Login_Footer_Haveseedphrase2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Footer_Haveseedphrase2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Vous avez votre propre phrase de récupération ?`)
		}),
		{
			parts: /** @type {(inputs: Login_Footer_Haveseedphrase2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Vous avez votre propre " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "phrase de récupération" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " ?" }])
			})
		}
	)
);

const ar_login_footer_haveseedphrase2 = /** @type {((inputs: Login_Footer_Haveseedphrase2Inputs) => LocalizedString) & { parts: (inputs: Login_Footer_Haveseedphrase2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Footer_Haveseedphrase2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`هل لديك عبارة استرداد خاصة بك؟`)
		}),
		{
			parts: /** @type {(inputs: Login_Footer_Haveseedphrase2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "هل لديك " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "عبارة استرداد" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " خاصة بك؟" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Have your own seed phrase?" |
*
* @param {Login_Footer_Haveseedphrase2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_footer_haveseedphrase2 = /** @type {((inputs?: Login_Footer_Haveseedphrase2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Login_Footer_Haveseedphrase2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Login_Footer_Haveseedphrase2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Login_Footer_Haveseedphrase2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_login_footer_haveseedphrase2(inputs)
			if (locale === "es") return es_login_footer_haveseedphrase2(inputs)
			if (locale === "fr") return fr_login_footer_haveseedphrase2(inputs)
			return ar_login_footer_haveseedphrase2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Login_Footer_Haveseedphrase2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_login_footer_haveseedphrase2.parts === "function" ? en_login_footer_haveseedphrase2.parts(inputs) : [{ type: "text", value: en_login_footer_haveseedphrase2(inputs) }]
				if (locale === "es") return typeof es_login_footer_haveseedphrase2.parts === "function" ? es_login_footer_haveseedphrase2.parts(inputs) : [{ type: "text", value: es_login_footer_haveseedphrase2(inputs) }]
				if (locale === "fr") return typeof fr_login_footer_haveseedphrase2.parts === "function" ? fr_login_footer_haveseedphrase2.parts(inputs) : [{ type: "text", value: fr_login_footer_haveseedphrase2(inputs) }]
				return typeof ar_login_footer_haveseedphrase2.parts === "function" ? ar_login_footer_haveseedphrase2.parts(inputs) : [{ type: "text", value: ar_login_footer_haveseedphrase2(inputs) }]
			})
		}
	)
);
export { login_footer_haveseedphrase2 as "login.footer.haveSeedPhrase" }