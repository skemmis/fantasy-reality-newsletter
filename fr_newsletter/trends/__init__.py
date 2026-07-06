"""Market trend scanners (stub — next milestone).

Planned scanners, each yielding ``Story`` candidates with the data needed to
chart and write about them:

- ``volatility``  — markets whose daily price range spiked vs their trailing norm
- ``torn``        — high-volume markets pinned near 50c (genuine disagreement)
- ``whiplash``    — markets that reversed a large move within a day
- ``volume_pop``  — sleepy markets that suddenly attracted volume

Each scanner consumes the same candle data used by ``fr_newsletter.viz``, so a
surfaced trend can be charted with one call.
"""
