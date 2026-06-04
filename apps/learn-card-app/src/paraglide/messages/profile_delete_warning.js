/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Profile_Delete_WarningInputs */

const en_profile_delete_warning = /** @type {((inputs: Profile_Delete_WarningInputs) => LocalizedString) & { parts: (inputs: Profile_Delete_WarningInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Profile_Delete_WarningInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Deleting your account will permanently delete your identity on ${i?.brand} and all of your credentials. Warning, this action cannot be undone!`)
		}),
		{
			parts: /** @type {(inputs: Profile_Delete_WarningInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Deleting your account will permanently delete your identity on " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " and all of your credentials. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Warning, this action cannot be undone!" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_profile_delete_warning = /** @type {((inputs: Profile_Delete_WarningInputs) => LocalizedString) & { parts: (inputs: Profile_Delete_WarningInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Profile_Delete_WarningInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Al eliminar su cuenta, se eliminará permanentemente su identidad en ${i?.brand} y todas sus credenciales. ¡Advertencia, esta acción no se puede deshacer!`)
		}),
		{
			parts: /** @type {(inputs: Profile_Delete_WarningInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Al eliminar su cuenta, se eliminará permanentemente su identidad en " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " y todas sus credenciales. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "¡Advertencia, esta acción no se puede deshacer!" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const de_profile_delete_warning = /** @type {((inputs: Profile_Delete_WarningInputs) => LocalizedString) & { parts: (inputs: Profile_Delete_WarningInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Profile_Delete_WarningInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Durch das Löschen Ihres Kontos werden Ihre Identität bei ${i?.brand} und alle Ihre Anmeldeinformationen dauerhaft gelöscht. Achtung, diese Aktion kann nicht rückgängig gemacht werden!`)
		}),
		{
			parts: /** @type {(inputs: Profile_Delete_WarningInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Durch das Löschen Ihres Kontos werden Ihre Identität bei " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " und alle Ihre Anmeldeinformationen dauerhaft gelöscht. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Achtung, diese Aktion kann nicht rückgängig gemacht werden!" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_profile_delete_warning = /** @type {((inputs: Profile_Delete_WarningInputs) => LocalizedString) & { parts: (inputs: Profile_Delete_WarningInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Profile_Delete_WarningInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`سيؤدي حذف حسابك إلى حذف هويتك نهائيًا على ${i?.brand} وجميع بيانات الاعتماد الخاصة بك. تحذير، لا يمكن التراجع عن هذا الإجراء!`)
		}),
		{
			parts: /** @type {(inputs: Profile_Delete_WarningInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "سيؤدي حذف حسابك إلى حذف هويتك نهائيًا على " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " وجميع بيانات الاعتماد الخاصة بك. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "تحذير، لا يمكن التراجع عن هذا الإجراء!" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_profile_delete_warning = /** @type {((inputs: Profile_Delete_WarningInputs) => LocalizedString) & { parts: (inputs: Profile_Delete_WarningInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Profile_Delete_WarningInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`La suppression de votre compte supprimera définitivement votre identité sur ${i?.brand} et toutes vos informations d'identification. Attention, cette action est irréversible !`)
		}),
		{
			parts: /** @type {(inputs: Profile_Delete_WarningInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "La suppression de votre compte supprimera définitivement votre identité sur " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " et toutes vos informations d'identification. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Attention, cette action est irréversible !" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ko_profile_delete_warning = /** @type {((inputs: Profile_Delete_WarningInputs) => LocalizedString) & { parts: (inputs: Profile_Delete_WarningInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Profile_Delete_WarningInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`계정을 삭제하면 ${i?.brand}의 신원과 모든 자격 증명이 영구적으로 삭제됩니다. 경고, 이 작업은 취소할 수 없습니다!`)
		}),
		{
			parts: /** @type {(inputs: Profile_Delete_WarningInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "계정을 삭제하면 " }, { type: "text", value: String(i?.brand) }, { type: "text", value: "의 신원과 모든 자격 증명이 영구적으로 삭제됩니다. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "경고, 이 작업은 취소할 수 없습니다!" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Deleting your account will permanently delete your identity on {brand} and all of your credentials. Warning, this action cannot be undone!" |
*
* @param {Profile_Delete_WarningInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_delete_warning = /** @type {((inputs: Profile_Delete_WarningInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & { parts: (inputs: Profile_Delete_WarningInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Profile_Delete_WarningInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Profile_Delete_WarningInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_profile_delete_warning(inputs)
			if (locale === "es") return es_profile_delete_warning(inputs)
			if (locale === "de") return de_profile_delete_warning(inputs)
			if (locale === "ar") return ar_profile_delete_warning(inputs)
			if (locale === "fr") return fr_profile_delete_warning(inputs)
			return ko_profile_delete_warning(inputs)
		}),
		{
			parts: /** @type {(inputs: Profile_Delete_WarningInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_profile_delete_warning.parts === "function" ? en_profile_delete_warning.parts(inputs) : [{ type: "text", value: en_profile_delete_warning(inputs) }]
				if (locale === "es") return typeof es_profile_delete_warning.parts === "function" ? es_profile_delete_warning.parts(inputs) : [{ type: "text", value: es_profile_delete_warning(inputs) }]
				if (locale === "de") return typeof de_profile_delete_warning.parts === "function" ? de_profile_delete_warning.parts(inputs) : [{ type: "text", value: de_profile_delete_warning(inputs) }]
				if (locale === "ar") return typeof ar_profile_delete_warning.parts === "function" ? ar_profile_delete_warning.parts(inputs) : [{ type: "text", value: ar_profile_delete_warning(inputs) }]
				if (locale === "fr") return typeof fr_profile_delete_warning.parts === "function" ? fr_profile_delete_warning.parts(inputs) : [{ type: "text", value: fr_profile_delete_warning(inputs) }]
				return typeof ko_profile_delete_warning.parts === "function" ? ko_profile_delete_warning.parts(inputs) : [{ type: "text", value: ko_profile_delete_warning(inputs) }]
			})
		}
	)
);
export { profile_delete_warning as "profile.delete.warning" }