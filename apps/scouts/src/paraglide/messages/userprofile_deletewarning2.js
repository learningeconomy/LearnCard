/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Deletewarning2Inputs */

const en_userprofile_deletewarning2 = /** @type {((inputs: Userprofile_Deletewarning2Inputs) => LocalizedString) & { parts: (inputs: Userprofile_Deletewarning2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Userprofile_Deletewarning2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Deleting your account will permanently delete your identity on ScoutPass and all of your credentials. Warning, this action cannot be undone!`)
		}),
		{
			parts: /** @type {(inputs: Userprofile_Deletewarning2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Deleting your account will permanently delete your identity on ScoutPass and all of your credentials. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Warning, this action cannot be undone!" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_userprofile_deletewarning2 = /** @type {((inputs: Userprofile_Deletewarning2Inputs) => LocalizedString) & { parts: (inputs: Userprofile_Deletewarning2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Userprofile_Deletewarning2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Eliminar tu cuenta borrará permanentemente tu identidad en ScoutPass y todas tus credenciales. Atención, ¡esta acción no se puede deshacer!`)
		}),
		{
			parts: /** @type {(inputs: Userprofile_Deletewarning2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Eliminar tu cuenta borrará permanentemente tu identidad en ScoutPass y todas tus credenciales. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Atención, ¡esta acción no se puede deshacer!" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_userprofile_deletewarning2 = /** @type {((inputs: Userprofile_Deletewarning2Inputs) => LocalizedString) & { parts: (inputs: Userprofile_Deletewarning2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Userprofile_Deletewarning2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`La suppression de votre compte effacera définitivement votre identité sur ScoutPass ainsi que tous vos justificatifs. Attention, cette action est irréversible !`)
		}),
		{
			parts: /** @type {(inputs: Userprofile_Deletewarning2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "La suppression de votre compte effacera définitivement votre identité sur ScoutPass ainsi que tous vos justificatifs. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Attention, cette action est irréversible !" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_userprofile_deletewarning2 = /** @type {((inputs: Userprofile_Deletewarning2Inputs) => LocalizedString) & { parts: (inputs: Userprofile_Deletewarning2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Userprofile_Deletewarning2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Deleting your account will permanently delete your identity on ScoutPass and all of your credentials. Warning, this action cannot be undone!`)
		}),
		{
			parts: /** @type {(inputs: Userprofile_Deletewarning2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Deleting your account will permanently delete your identity on ScoutPass and all of your credentials. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Warning, this action cannot be undone!" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Deleting your account will permanently delete your identity on ScoutPass and all of your credentials. Warning, this action cannot be undone!" |
*
* @param {Userprofile_Deletewarning2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_deletewarning2 = /** @type {((inputs?: Userprofile_Deletewarning2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Userprofile_Deletewarning2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Userprofile_Deletewarning2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Userprofile_Deletewarning2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_userprofile_deletewarning2(inputs)
			if (locale === "es") return es_userprofile_deletewarning2(inputs)
			if (locale === "fr") return fr_userprofile_deletewarning2(inputs)
			return ar_userprofile_deletewarning2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Userprofile_Deletewarning2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_userprofile_deletewarning2.parts === "function" ? en_userprofile_deletewarning2.parts(inputs) : [{ type: "text", value: en_userprofile_deletewarning2(inputs) }]
				if (locale === "es") return typeof es_userprofile_deletewarning2.parts === "function" ? es_userprofile_deletewarning2.parts(inputs) : [{ type: "text", value: es_userprofile_deletewarning2(inputs) }]
				if (locale === "fr") return typeof fr_userprofile_deletewarning2.parts === "function" ? fr_userprofile_deletewarning2.parts(inputs) : [{ type: "text", value: fr_userprofile_deletewarning2(inputs) }]
				return typeof ar_userprofile_deletewarning2.parts === "function" ? ar_userprofile_deletewarning2.parts(inputs) : [{ type: "text", value: ar_userprofile_deletewarning2(inputs) }]
			})
		}
	)
);
export { userprofile_deletewarning2 as "userProfile.deleteWarning" }