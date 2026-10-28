import { describe, it, expect } from "vitest";
import { parseDomainInfo, buildSubdomainUrl } from "./tenant";

describe("Multi-Tenancy Domain Resolver", () => {
  it("extracts subdomain from rental.triotek.co.ke host", () => {
    const res = parseDomainInfo("kilimani.rental.triotek.co.ke:3000");
    expect(res.subdomain).toBe("kilimani");
    expect(res.customDomain).toBeNull();
    expect(res.isBasePlatform).toBe(false);
  });

  it("identifies base platform domain", () => {
    const res = parseDomainInfo("rental.triotek.co.ke");
    expect(res.subdomain).toBeNull();
    expect(res.customDomain).toBeNull();
    expect(res.isBasePlatform).toBe(true);
  });

  it("handles custom domain", () => {
    const res = parseDomainInfo("rentals.myagency.co.ke");
    expect(res.subdomain).toBeNull();
    expect(res.customDomain).toBe("rentals.myagency.co.ke");
    expect(res.isBasePlatform).toBe(false);
  });

  it("builds correct subdomain url", () => {
    expect(buildSubdomainUrl("kilimani")).toBe("https://kilimani.rental.triotek.co.ke");
    expect(buildSubdomainUrl("kilimani", "rentals.custom.com")).toBe("https://rentals.custom.com");
  });
});
