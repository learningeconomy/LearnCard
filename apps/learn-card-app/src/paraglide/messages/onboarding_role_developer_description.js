/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Role_Developer_DescriptionInputs */

const en_onboarding_role_developer_description = /** @type {(inputs: Onboarding_Role_Developer_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`I manage systems, data, and technology for my organization.`)
};

const es_onboarding_role_developer_description = /** @type {(inputs: Onboarding_Role_Developer_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administro sistemas, datos y tecnología para mi organización.`)
};

const fr_onboarding_role_developer_description = /** @type {(inputs: Onboarding_Role_Developer_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je gère les systèmes, les données et la technologie pour mon organisation.`)
};

const ar_onboarding_role_developer_description = /** @type {(inputs: Onboarding_Role_Developer_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدير الأنظمة والبيانات والتكنولوجيا لمؤسستي.`)
};

/**
* | output |
* | --- |
* | "I manage systems, data, and technology for my organization." |
*
* @param {Onboarding_Role_Developer_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_role_developer_description = /** @type {((inputs?: Onboarding_Role_Developer_DescriptionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Developer_DescriptionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_developer_description(inputs)
	if (locale === "es") return es_onboarding_role_developer_description(inputs)
	if (locale === "fr") return fr_onboarding_role_developer_description(inputs)
	return ar_onboarding_role_developer_description(inputs)
});
export { onboarding_role_developer_description as "onboarding.role.developer.description" }