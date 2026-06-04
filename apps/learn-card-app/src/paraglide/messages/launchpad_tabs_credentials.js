/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Tabs_CredentialsInputs */

const en_launchpad_tabs_credentials = /** @type {(inputs: Launchpad_Tabs_CredentialsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials`)
};

const es_launchpad_tabs_credentials = /** @type {(inputs: Launchpad_Tabs_CredentialsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credenciales`)
};

const de_launchpad_tabs_credentials = /** @type {(inputs: Launchpad_Tabs_CredentialsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigungen`)
};

const ar_launchpad_tabs_credentials = /** @type {(inputs: Launchpad_Tabs_CredentialsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشهادات`)
};

const fr_launchpad_tabs_credentials = /** @type {(inputs: Launchpad_Tabs_CredentialsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titres`)
};

const ko_launchpad_tabs_credentials = /** @type {(inputs: Launchpad_Tabs_CredentialsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격증명`)
};

/**
* | output |
* | --- |
* | "Credentials" |
*
* @param {Launchpad_Tabs_CredentialsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_credentials = /** @type {((inputs?: Launchpad_Tabs_CredentialsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_CredentialsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_credentials(inputs)
	if (locale === "es") return es_launchpad_tabs_credentials(inputs)
	if (locale === "de") return de_launchpad_tabs_credentials(inputs)
	if (locale === "ar") return ar_launchpad_tabs_credentials(inputs)
	if (locale === "fr") return fr_launchpad_tabs_credentials(inputs)
	return ko_launchpad_tabs_credentials(inputs)
});
export { launchpad_tabs_credentials as "launchpad.tabs.credentials" }