/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Tabs_GamesInputs */

const en_launchpad_tabs_games = /** @type {(inputs: Launchpad_Tabs_GamesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Games`)
};

const es_launchpad_tabs_games = /** @type {(inputs: Launchpad_Tabs_GamesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Juegos`)
};

const de_launchpad_tabs_games = /** @type {(inputs: Launchpad_Tabs_GamesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spiele`)
};

const ar_launchpad_tabs_games = /** @type {(inputs: Launchpad_Tabs_GamesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الألعاب`)
};

/**
* | output |
* | --- |
* | "Games" |
*
* @param {Launchpad_Tabs_GamesInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_games = /** @type {((inputs?: Launchpad_Tabs_GamesInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_GamesInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_games(inputs)
	if (locale === "es") return es_launchpad_tabs_games(inputs)
	if (locale === "de") return de_launchpad_tabs_games(inputs)
	return ar_launchpad_tabs_games(inputs)
});
export { launchpad_tabs_games as "launchpad.tabs.games" }