/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Login_Seedphrase_Description1Inputs */

const en_login_seedphrase_description1 = /** @type {((inputs: Login_Seedphrase_Description1Inputs) => LocalizedString) & { parts: (inputs: Login_Seedphrase_Description1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Seedphrase_Description1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Enter your 64-character or word phrase seed below to regain access to an existing ${i?.brand} passport.`)
		}),
		{
			parts: /** @type {(inputs: Login_Seedphrase_Description1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Enter your " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "64-character" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " or " }, { type: "markup-start", name: "2", options: {}, attributes: {} }, { type: "text", value: "word phrase seed" }, { type: "markup-end", name: "2", options: {}, attributes: {} }, { type: "text", value: " below to regain access to an existing " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " passport." }])
			})
		}
	)
);

const es_login_seedphrase_description1 = /** @type {((inputs: Login_Seedphrase_Description1Inputs) => LocalizedString) & { parts: (inputs: Login_Seedphrase_Description1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Seedphrase_Description1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Ingresa tu semilla de 64 caracteres o frase de palabras abajo para recuperar el acceso a un pasaporte ${i?.brand} existente.`)
		}),
		{
			parts: /** @type {(inputs: Login_Seedphrase_Description1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Ingresa tu " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "semilla de 64 caracteres" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " o " }, { type: "markup-start", name: "2", options: {}, attributes: {} }, { type: "text", value: "frase de palabras" }, { type: "markup-end", name: "2", options: {}, attributes: {} }, { type: "text", value: " abajo para recuperar el acceso a un pasaporte " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " existente." }])
			})
		}
	)
);

const fr_login_seedphrase_description1 = /** @type {((inputs: Login_Seedphrase_Description1Inputs) => LocalizedString) & { parts: (inputs: Login_Seedphrase_Description1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Seedphrase_Description1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Saisissez votre phrase de 64 caractères ou phrase de mots ci-dessous pour retrouver l'accès à un passeport ${i?.brand} existant.`)
		}),
		{
			parts: /** @type {(inputs: Login_Seedphrase_Description1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Saisissez votre " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "phrase de 64 caractères" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " ou " }, { type: "markup-start", name: "2", options: {}, attributes: {} }, { type: "text", value: "phrase de mots" }, { type: "markup-end", name: "2", options: {}, attributes: {} }, { type: "text", value: " ci-dessous pour retrouver l'accès à un passeport " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " existant." }])
			})
		}
	)
);

const ar_login_seedphrase_description1 = /** @type {((inputs: Login_Seedphrase_Description1Inputs) => LocalizedString) & { parts: (inputs: Login_Seedphrase_Description1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Seedphrase_Description1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`أدخل عبارة الاسترداد المكونة من 64 حرفاً أو عبارة الكلمات أدناه لاستعادة الوصول إلى جواز سفر ${i?.brand} الحالي.`)
		}),
		{
			parts: /** @type {(inputs: Login_Seedphrase_Description1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "أدخل " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "عبارة الاسترداد المكونة من 64 حرفاً" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " أو " }, { type: "markup-start", name: "2", options: {}, attributes: {} }, { type: "text", value: "عبارة الكلمات" }, { type: "markup-end", name: "2", options: {}, attributes: {} }, { type: "text", value: " أدناه لاستعادة الوصول إلى جواز سفر " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " الحالي." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Enter your 64-character or word phrase seed below to regain access to an existing {brand} passport." |
*
* @param {Login_Seedphrase_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_description1 = /** @type {((inputs: Login_Seedphrase_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Login_Seedphrase_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Login_Seedphrase_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "2": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Seedphrase_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_login_seedphrase_description1(inputs)
			if (locale === "es") return es_login_seedphrase_description1(inputs)
			if (locale === "fr") return fr_login_seedphrase_description1(inputs)
			return ar_login_seedphrase_description1(inputs)
		}),
		{
			parts: /** @type {(inputs: Login_Seedphrase_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_login_seedphrase_description1.parts === "function" ? en_login_seedphrase_description1.parts(inputs) : [{ type: "text", value: en_login_seedphrase_description1(inputs) }]
				if (locale === "es") return typeof es_login_seedphrase_description1.parts === "function" ? es_login_seedphrase_description1.parts(inputs) : [{ type: "text", value: es_login_seedphrase_description1(inputs) }]
				if (locale === "fr") return typeof fr_login_seedphrase_description1.parts === "function" ? fr_login_seedphrase_description1.parts(inputs) : [{ type: "text", value: fr_login_seedphrase_description1(inputs) }]
				return typeof ar_login_seedphrase_description1.parts === "function" ? ar_login_seedphrase_description1.parts(inputs) : [{ type: "text", value: ar_login_seedphrase_description1(inputs) }]
			})
		}
	)
);
export { login_seedphrase_description1 as "login.seedPhrase.description" }