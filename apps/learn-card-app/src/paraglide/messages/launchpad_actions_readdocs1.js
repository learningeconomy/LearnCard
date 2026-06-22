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

const fr_launchpad_actions_readdocs1 = /** @type {(inputs: Launchpad_Actions_Readdocs1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lire la documentation`)
};

const ar_launchpad_actions_readdocs1 = /** @type {(inputs: Launchpad_Actions_Readdocs1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قراءة المستندات`)
};

/**
* | output |
* | --- |
* | "Read Docs" |
*
* @param {Launchpad_Actions_Readdocs1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_readdocs1 = /** @type {((inputs?: Launchpad_Actions_Readdocs1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Readdocs1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_readdocs1(inputs)
	if (locale === "es") return es_launchpad_actions_readdocs1(inputs)
	if (locale === "fr") return fr_launchpad_actions_readdocs1(inputs)
	return ar_launchpad_actions_readdocs1(inputs)
});
export { launchpad_actions_readdocs1 as "launchpad.actions.readDocs" }