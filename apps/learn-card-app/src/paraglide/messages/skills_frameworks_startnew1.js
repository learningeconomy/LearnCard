/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Frameworks_Startnew1Inputs */

const en_skills_frameworks_startnew1 = /** @type {(inputs: Skills_Frameworks_Startnew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Start a new framework. You can add skills manually or import a file after creating it.`)
};

const es_skills_frameworks_startnew1 = /** @type {(inputs: Skills_Frameworks_Startnew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea un nuevo marco. Puedes agregar competencias manualmente o importar un archivo después de crearlo.`)
};

const fr_skills_frameworks_startnew1 = /** @type {(inputs: Skills_Frameworks_Startnew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Démarrez un nouveau référentiel. Vous pouvez ajouter des compétences manuellement ou importer un fichier après l’avoir créé.`)
};

const ar_skills_frameworks_startnew1 = /** @type {(inputs: Skills_Frameworks_Startnew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابدأ إطارًا جديدًا. يمكنك إضافة المهارات يدويًا أو استيراد ملف بعد إنشائه.`)
};

/**
* | output |
* | --- |
* | "Start a new framework. You can add skills manually or import a file after creating it." |
*
* @param {Skills_Frameworks_Startnew1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_frameworks_startnew1 = /** @type {((inputs?: Skills_Frameworks_Startnew1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Frameworks_Startnew1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_frameworks_startnew1(inputs)
	if (locale === "es") return es_skills_frameworks_startnew1(inputs)
	if (locale === "fr") return fr_skills_frameworks_startnew1(inputs)
	return ar_skills_frameworks_startnew1(inputs)
});
export { skills_frameworks_startnew1 as "skills.frameworks.startNew" }