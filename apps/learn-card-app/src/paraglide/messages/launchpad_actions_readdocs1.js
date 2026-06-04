/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Readdocs1Inputs */

const en_launchpad_actions_readdocs1 = /** @type {(inputs: Launchpad_Actions_Readdocs1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Read Docs`)
};

const es_launchpad_actions_readdocs1 = /** @type {(inputs: Launchpad_Actions_Readdocs1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leer documentación`)
};

const de_launchpad_actions_readdocs1 = /** @type {(inputs: Launchpad_Actions_Readdocs1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dokumentation lesen`)
};

const ar_launchpad_actions_readdocs1 = /** @type {(inputs: Launchpad_Actions_Readdocs1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قراءة المستندات`)
};

const fr_launchpad_actions_readdocs1 = /** @type {(inputs: Launchpad_Actions_Readdocs1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lire la documentation`)
};

const ko_launchpad_actions_readdocs1 = /** @type {(inputs: Launchpad_Actions_Readdocs1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`문서 읽기`)
};

/**
* | output |
* | --- |
* | "Read Docs" |
*
* @param {Launchpad_Actions_Readdocs1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_readdocs1 = /** @type {((inputs?: Launchpad_Actions_Readdocs1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Readdocs1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_readdocs1(inputs)
	if (locale === "es") return es_launchpad_actions_readdocs1(inputs)
	if (locale === "de") return de_launchpad_actions_readdocs1(inputs)
	if (locale === "ar") return ar_launchpad_actions_readdocs1(inputs)
	if (locale === "fr") return fr_launchpad_actions_readdocs1(inputs)
	return ko_launchpad_actions_readdocs1(inputs)
});
export { launchpad_actions_readdocs1 as "launchpad.actions.readDocs" }