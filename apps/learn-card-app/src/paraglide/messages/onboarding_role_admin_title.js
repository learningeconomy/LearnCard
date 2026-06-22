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

const fr_onboarding_role_admin_title = /** @type {(inputs: Onboarding_Role_Admin_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrateur`)
};

const ar_onboarding_role_admin_title = /** @type {(inputs: Onboarding_Role_Admin_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسؤول`)
};

/**
* | output |
* | --- |
* | "Admin" |
*
* @param {Onboarding_Role_Admin_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_role_admin_title = /** @type {((inputs?: Onboarding_Role_Admin_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Admin_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_admin_title(inputs)
	if (locale === "es") return es_onboarding_role_admin_title(inputs)
	if (locale === "fr") return fr_onboarding_role_admin_title(inputs)
	return ar_onboarding_role_admin_title(inputs)
});
export { onboarding_role_admin_title as "onboarding.role.admin.title" }