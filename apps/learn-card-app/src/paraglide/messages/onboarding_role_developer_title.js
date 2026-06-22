/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Role_Developer_TitleInputs */

const en_onboarding_role_developer_title = /** @type {(inputs: Onboarding_Role_Developer_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Developer`)
};

const es_onboarding_role_developer_title = /** @type {(inputs: Onboarding_Role_Developer_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desarrollador`)
};

const fr_onboarding_role_developer_title = /** @type {(inputs: Onboarding_Role_Developer_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Développeur`)
};

const ar_onboarding_role_developer_title = /** @type {(inputs: Onboarding_Role_Developer_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطور`)
};

/**
* | output |
* | --- |
* | "Developer" |
*
* @param {Onboarding_Role_Developer_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_role_developer_title = /** @type {((inputs?: Onboarding_Role_Developer_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Developer_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_developer_title(inputs)
	if (locale === "es") return es_onboarding_role_developer_title(inputs)
	if (locale === "fr") return fr_onboarding_role_developer_title(inputs)
	return ar_onboarding_role_developer_title(inputs)
});
export { onboarding_role_developer_title as "onboarding.role.developer.title" }