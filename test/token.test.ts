import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { CliptoToken } from "../typechain";

describe("CliptoToken", () => {
  let account: SignerWithAddress;
  let dummy: SignerWithAddress;
  let cliptoToken: CliptoToken;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    account = accounts[0];
    dummy = accounts[1];

    const CliptoToken = await ethers.getContractFactory("CliptoToken");
    cliptoToken = await CliptoToken.deploy();
    await cliptoToken.deployed();

    const tx = await cliptoToken.initialize(
      account.address,
      account.address,
      account.address,
      "creator"
    );
    await tx.wait();
  });

  it("should return all readable data accurately", async () => {
    const totalSupply = await cliptoToken.totalSupply();
    expect(totalSupply.toNumber()).to.eql(0);
    expect(await cliptoToken.name()).to.eql("Clipto Creator - creator");
    expect(await cliptoToken.symbol()).to.eql("CTO");
    expect(await cliptoToken.contractURI()).to.eql(
      "ipfs://QmdLjLZsrbHHeAYoJvJdUKCo77Qj4r1qxRPPX1vBA6LgqH"
    );
    expect(await cliptoToken.owner()).to.eql(account.address);
  });

  it("should mint and update token supply and uri", async () => {
    let totalSupply = await cliptoToken.totalSupply();
    expect(totalSupply.toNumber()).to.eql(0);

    const tx = await cliptoToken
      .connect(account)
      .safeMint(dummy.address, "https://google.com");
    await tx.wait();

    totalSupply = await cliptoToken.totalSupply();
    expect(totalSupply.toNumber()).to.eql(1);
    expect(await cliptoToken.tokenURI(1)).to.eql("https://google.com");
    expect((await cliptoToken.balanceOf(dummy.address)).toNumber()).to.eql(1);
  });

  it("should read and update royalty info", async () => {
    let tx = await cliptoToken
      .connect(account)
      .safeMint(dummy.address, "https://google.com");
    await tx.wait();

    let royalty = await cliptoToken.royaltyInfo(1, 1000);
    expect(royalty[0]).to.eql(account.address);
    expect(royalty[1].toNumber()).to.eql(50);

    tx = await cliptoToken.connect(account).setRoyaltyRate(10, 100);
    await tx.wait();

    royalty = await cliptoToken.royaltyInfo(1, 1000);
    expect(royalty[0]).to.eql(account.address);
    expect(royalty[1].toNumber()).to.eql(100);
  });

  it("should burn token and update balance", async () => {
    let tx = await cliptoToken
      .connect(account)
      .safeMint(dummy.address, "https://google.com");
    await tx.wait();

    expect((await cliptoToken.balanceOf(dummy.address)).toNumber()).to.eql(1);

    tx = await cliptoToken.connect(dummy).burn(1);
    await tx.wait();

    expect((await cliptoToken.balanceOf(dummy.address)).toNumber()).to.eql(0);
  });

  it("should transfer ownership on call", async () => {
    expect(await cliptoToken.owner()).to.eql(account.address);

    let tx = await cliptoToken.connect(account).transferOwnership(dummy.address);
    await tx.wait();

    expect(await cliptoToken.owner()).to.eql(dummy.address);

    tx = await cliptoToken.connect(account).safeMint(dummy.address, "https://google.com");
    await tx.wait();
    tx = await cliptoToken.connect(account).setRoyaltyRate(10, 100);
    await tx.wait();

    const royalty = await cliptoToken.royaltyInfo(1, 1000);
    expect(royalty[0]).to.eql(account.address);
    expect(royalty[1].toNumber()).to.eql(100);
  });
});