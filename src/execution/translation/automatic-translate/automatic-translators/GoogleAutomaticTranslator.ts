import puppeteer from 'puppeteer';
import spaceTrim from 'spacetrim';
import { forTime } from 'waitasecond';
import { IAutomaticTranslator } from './IAutomaticTranslator';
import { ITranslatorOptions } from './ITranslatorOptions';
import { extractMultiplicatedOccurrence } from './utils/extractMultiplicatedOccurrence';

export interface IGoogleAutomaticTranslatorOptions extends ITranslatorOptions {
    isHeadless?: boolean;
}
export class GoogleAutomaticTranslator implements IAutomaticTranslator {
    private readonly whenReady: Promise<void>;
    private browser: puppeteer.Browser;
    private page: puppeteer.Page;

    public constructor(private readonly options: IGoogleAutomaticTranslatorOptions) {
        this.whenReady = this.init();
    }

    private async init() {
        const url = new URL(`https://translate.google.cz`);
        url.searchParams.set('op', 'translate');
        url.searchParams.set('sl', this.options.from);
        url.searchParams.set('tl', this.options.to);

        this.browser = await puppeteer.launch({ headless: this.options.isHeadless ?? true });
        this.page = await this.browser.newPage();
        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'en',
        });
        await this.page.goto(url.href);

        // TODO: Make this in english
        await (await this.page.$x(`//button[contains(., 'Souhlasím')]`))[0]!?.click();
        await this.page.waitForSelector(`textarea`, { timeout: 5000 });
    }

    public async translate(message: string): Promise<string> {
        message = message.trim();

        if (message === '') {
            return '';
        }

        try {
            await this.whenReady;

            // TODO: Here must be queue

            const inputElement = (await this.page.$x(`//textarea[contains(@aria-label, 'Zdrojový text')]`))[0]!;
            await inputElement.focus();

            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('A');
            await this.page.keyboard.up('Control');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(message);

            // await forEver();

            // TODO: Instead of while-loop use forValueDefined
            let translatedElement: puppeteer.ElementHandle | undefined;

            let i = 0;
            while (!translatedElement) {
                await forTime(500 /* for retry to find an translation result */);
                translatedElement = (await this.page.$x(`//*[@data-result-index]`))[0]!;
                //console.log(translatedElement);

                if (i++ > 100) {
                    throw new Error('Can not find data-result-index on the page.');
                }
            }

            let translatedMessage = await this.page.evaluate((el) => el.textContent, translatedElement);

            translatedMessage = translatedMessage.split(`Úplné výsledky`)[0]!;

            translatedMessage = spaceTrim(translatedMessage);

            //console.log(`(${translatedMessage})`);
            //await forEver();

            try {
                return extractMultiplicatedOccurrence(translatedMessage);
            } catch (error) {
                // console.error(error);
                return translatedMessage;
            }
        } catch (error) {
            console.error(error);
            return message;
        }
    }
}

/**
 * TODO: Implement IDestroyable
 *       >  await browser.close();
 */
