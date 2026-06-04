/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Role_Admin_TitleInputs */

const en_onboarding_role_admin_title = /** @type {(inputs: Onboarding_Role_Admin_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin`)
};

const es_onboarding_role_admin_title = /** @type {(inputs: Onboarding_Role_Admin_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrador`)
};

const de_onboarding_role_admin_title = /** @type {(inputs: Onboarding_Role_Admin_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrator`)
};

const ar_onboarding_role_admin_title = /** @type {(inputs: Onboarding_Role_Admin_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسؤول`)
};

const fr_onboarding_role_admin_title = /** @type {(inputs: Onboarding_Role_Admin_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrateur`)
};

const ko_onboarding_role_admin_title = /** @type {(inputs: Onboarding_Role_Admin_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`관리자`)
};

/**
* | output |
* | --- |
* | "Admin" |
*
* @param {Onboarding_Role_Admin_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_role_admin_title = /** @type {((inputs?: Onboarding_Role_Admin_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Admin_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_admin_title(inputs)
	if (locale === "es") return es_onboarding_role_admin_title(inputs)
	if (locale === "de") return de_onboarding_role_admin_title(inputs)
	if (locale === "ar") return ar_onboarding_role_admin_title(inputs)
	if (locale === "fr") return fr_onboarding_role_admin_title(inputs)
	return ko_onboarding_role_admin_title(inputs)
});
export { onboarding_role_admin_title as "onboarding.role.admin.title" }