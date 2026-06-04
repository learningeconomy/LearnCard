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

const de_onboarding_role_developer_description = /** @type {(inputs: Onboarding_Role_Developer_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ich verwalte Systeme, Daten und Technologie für meine Organisation.`)
};

const ar_onboarding_role_developer_description = /** @type {(inputs: Onboarding_Role_Developer_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدير الأنظمة والبيانات والتكنولوجيا لمؤسستي.`)
};

const fr_onboarding_role_developer_description = /** @type {(inputs: Onboarding_Role_Developer_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je gère les systèmes, les données et la technologie pour mon organisation.`)
};

const ko_onboarding_role_developer_description = /** @type {(inputs: Onboarding_Role_Developer_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`조직의 시스템, 데이터 및 기술을 관리합니다.`)
};

/**
* | output |
* | --- |
* | "I manage systems, data, and technology for my organization." |
*
* @param {Onboarding_Role_Developer_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_role_developer_description = /** @type {((inputs?: Onboarding_Role_Developer_DescriptionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Developer_DescriptionInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_developer_description(inputs)
	if (locale === "es") return es_onboarding_role_developer_description(inputs)
	if (locale === "de") return de_onboarding_role_developer_description(inputs)
	if (locale === "ar") return ar_onboarding_role_developer_description(inputs)
	if (locale === "fr") return fr_onboarding_role_developer_description(inputs)
	return ko_onboarding_role_developer_description(inputs)
});
export { onboarding_role_developer_description as "onboarding.role.developer.description" }