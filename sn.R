library(sn)
library(ggplot2)

x <- seq(-5, 5, by = 0.1)
y <- pst(x, xi = 1, omega = 1, alpha = -20, nu = 3)
data.frame(x = x, y = y) %>% 
  ggplot(aes(x = x, y=y)) + 
  geom_line() + 
  theme_minimal() + 
  ylim(0, 1)
