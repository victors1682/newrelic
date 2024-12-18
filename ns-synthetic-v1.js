
const runSyntheticMonitor = async ($browser,logger, document, $util,  DefaultTimeout, ExtraTimeout, SITE_URL, SITE_CODE) => {
// custom metadata for filtering out traffic in analytics
const INTERNAL_COOKIE = "is_hearst_cc_internal";
// hiding newsletter modal
const NEWSLETTERS_COOKIE = "hide_newsletter_popup";

    // SELECTORS
const BUY_BUTTON_SELECTOR = '[data-testid="buy-button"]';
const OOS_TEXTS_SELECTOR = 'p[data-fs-text-stock="true"]';

  try {
    // Setup
    await $browser.addHeader("x-no-ads", "yes");
    await $browser.getCapabilities();

    // Health check
    try {
      await $browser.get(`${SITE_URL}/api/health/live`);
    } catch (err) {
      $util.insights.set("severity", "P0");
      throw new Error("Health check failed, stopping execution.");
    }

    // Set cookies
    logger.log(
      0,
      `Set metadata cookie ${INTERNAL_COOKIE}`,
      `journey-${SITE_CODE}-store`
    );
    await $browser.manage().addCookie({
      name: INTERNAL_COOKIE,
      value: "true",
      domain: SITE_URL.replace("https://shop.", ".").replace("/", ""),
    });

    logger.log(
      0,
      `Set metadata cookie ${NEWSLETTERS_COOKIE}`,
      `journey-${SITE_CODE}-store`
    );
    await $browser.manage().addCookie({
      name: NEWSLETTERS_COOKIE,
      value: "true",
      domain: SITE_URL.replace("https://shop.", ".").replace("/", ""),
    });

    // Open Homepage
    try {
      logger.log(1, `Open URL ${SITE_URL}`, `journey-${SITE_CODE}-store`);
      await $browser.get(SITE_URL);
    } catch (err) {
      $util.insights.set("severity", "P0");
      throw new Error(`unable to open ${SITE_CODE} homepage`);
    }

    // Click Second Category in Nav
    try {
      logger.log(
        2,
        "Click Second Category in Nav",
        `journey-${SITE_CODE}-store`
      );
      await $browser.executeScript(() => {
        const elements = document.querySelectorAll(
          '[data-testid="data-fs-button-dropdown-link"][data-fs-button-dropdown-link-highlight="false"]'
        );
        if (elements.length > 1) {
          elements[1].click();
          return true;
        }
        throw new Error("Second category not found in Nav");
      });
      await new Promise((resolve) => setTimeout(resolve, ExtraTimeout));
    } catch (err) {
      $util.insights.set("severity", "P0");
      throw new Error(`Unable to click on one category of the main NavBar`);
    }

    // Click First PLP Product
    try {
      logger.log(
        3,
        "Click on a random PLP product",
        `journey-${SITE_CODE}-store`
      );
      await $browser.executeScript(() => {
        const elements = document.querySelectorAll(
          '[data-testid="product-link"]'
        );
        if (elements.length > 1) {
          const selectedEl =
            elements[Math.floor(elements.length * Math.random()) + 1];
          if (selectedEl) {
            selectedEl.click();
          } else {
            elements[2].click();
          }
          return true;
        }
        throw new Error("Error finding product in PLP");
      });
      await new Promise((resolve) => setTimeout(resolve, ExtraTimeout));
    } catch (err) {
      $util.insights.set("severity", "P1");
      throw new Error(`PLP is not loading, timeout: ${ExtraTimeout}`);
    }

    // Check if product is OOS
    try {
      const isOOS = await $browser.executeScript((selector) => {
        const element = document.querySelector(selector);
        return element && element.innerText.trim() === "Out of Stock";
      }, OOS_TEXTS_SELECTOR);

      if (isOOS) {
        logger.log(
          "info",
          "SKU OOS found - ending test successfully",
          `journey-${SITE_CODE}-store`
        );
        $util.insights.set("monitorOutcome", "SUCCESS");
        logger.endTestCase(`journey-${SITE_CODE}-store`);
        return;
      }
    } catch (err) {
      $util.insights.set("severity", "P3");
      throw new Error(`Error checking OOS status`);
    }

    // Click Increment Quantity Button
    try {
      logger.log(
        4,
        "Click Increment Quantity Button",
        `journey-${SITE_CODE}-store`
      );
      const incrementButton = await $browser.waitForAndFindElement(
        By.css('[aria-label="Increment Quantity"]'),
        DefaultTimeout
      );
      await incrementButton.click();
      await new Promise((resolve) => setTimeout(resolve, ExtraTimeout));
    } catch (err) {
      $util.insights.set("severity", "P2");
      throw new Error(`Unable to increase the quantity of the product`);
    }

    // Add to Cart #1
    try {
      logger.log(5, "Add to Cart #1", `journey-${SITE_CODE}-store`);
      const buyButton = await $browser.waitForAndFindElement(
        By.css(BUY_BUTTON_SELECTOR),
        DefaultTimeout
      );
      await buyButton.click();
      await new Promise((resolve) => setTimeout(resolve, ExtraTimeout * 2));
    } catch (err) {
      $util.insights.set("severity", "P2");
      throw new Error(`Unable to add the product to the cart`);
    }

    // Remove Item from Cart
    try {
      logger.log(6, "Remove Item from Cart", `journey-${SITE_CODE}-store`);
      const removeButton = await $browser.waitForAndFindElement(
        By.css('[data-testid="remove-button"]'),
        DefaultTimeout
      );
      await removeButton.click();
      await new Promise((resolve) => setTimeout(resolve, ExtraTimeout));
    } catch (err) {
      $util.insights.set("severity", "P2");
      throw new Error(`Unable to remove the product from the cart`);
    }

    // Close Minicart
    try {
      logger.log(7, "Close Minicart", `journey-${SITE_CODE}-store`);
      const closeButton = await $browser.waitForAndFindElement(
        By.css('[data-testid="fs-cart-sidebar-button-close"]'),
        DefaultTimeout
      );
      await closeButton.click();
      await new Promise((resolve) => setTimeout(resolve, ExtraTimeout));
    } catch (err) {
      $util.insights.set("severity", "P2");
      throw new Error(`Unable to close the mini cart`);
    }

    // Add to Cart #2
    try {
      logger.log(8, "Add to Cart #2", `journey-${SITE_CODE}-store`);
      const buyButton = await $browser.waitForAndFindElement(
        By.css(BUY_BUTTON_SELECTOR),
        DefaultTimeout
      );
      await buyButton.click();
      await new Promise((resolve) => setTimeout(resolve, ExtraTimeout));
    } catch (err) {
      $util.insights.set("severity", "P2");
      throw new Error(
        `Unable to add the product to the cart for the second time`
      );
    }

    // Wait for page load
    await new Promise((resolve) => setTimeout(resolve, ExtraTimeout));

    // Click Minicart to go to Checkout
    try {
      logger.log(9, "Minicart Go to Checkout", `journey-${SITE_CODE}-store`);
      const checkoutButton = await $browser.waitForAndFindElement(
        By.css('[data-testid="go-to-checkout-button"]'),
        DefaultTimeout
      );
      await checkoutButton.click();
    } catch (err) {
      $util.insights.set("severity", "P1");
      throw new Error(
        `Unable to click on the checkout button to go to checkout page`
      );
    }

    logger.endTestCase(`journey-${SITE_CODE}-store`);
  } catch (error) {
    logger.error(error, `journey-${SITE_CODE}-store`);
    throw error;
  }
}
module.exports = { runSyntheticMonitor };
