/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Useinyourapp6Inputs */

const en_developerportal_guides_embedapp_templatemanager_useinyourapp6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Useinyourapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use in your app:`)
};

const es_developerportal_guides_embedapp_templatemanager_useinyourapp6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Useinyourapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use in your app:`)
};

const fr_developerportal_guides_embedapp_templatemanager_useinyourapp6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Useinyourapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use in your app:`)
};

const ar_developerportal_guides_embedapp_templatemanager_useinyourapp6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Useinyourapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use in your app:`)
};

/**
* | output |
* | --- |
* | "Use in your app:" |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Useinyourapp6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_useinyourapp6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Useinyourapp6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Useinyourapp6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_useinyourapp6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_useinyourapp6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_useinyourapp6(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_useinyourapp6(inputs)
});
export { developerportal_guides_embedapp_templatemanager_useinyourapp6 as "developerPortal.guides.embedApp.templateManager.useInYourApp" }